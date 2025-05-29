#!/usr/bin/env python2

# gazebo_autonomous_controller.py

import rospy
import numpy as np
import math
from geometry_msgs.msg import Twist, TwistStamped
from sensor_msgs.msg import LaserScan, Imu, FluidPressure
from uuv_sensor_ros_plugins_msgs.msg import DVL
from tf.transformations import euler_from_quaternion

class GazeboAutonomousController:
    def __init__(self):
        rospy.init_node('gazebo_autonomous_controller')
        
        # Publishers
        self.cmd_vel_pub = rospy.Publisher('cmd_vel_out', Twist, queue_size=1)
        
        # Subscribers - Gerçek topic isimlerini kullan
        self.dvl_sub = rospy.Subscriber('dvl_data', DVL, self.dvl_callback)
        self.dvl_twist_sub = rospy.Subscriber('dvl_twist', TwistStamped, self.dvl_twist_callback)
        self.imu_sub = rospy.Subscriber('imu_data', Imu, self.imu_callback)
        self.pressure_sub = rospy.Subscriber('pressure_data', FluidPressure, self.pressure_callback)
        
        # DVL Sonar subscribers (engel tespiti için)
        self.dvl_sonar0_sub = rospy.Subscriber('dvl_sonar0', LaserScan, self.dvl_sonar0_callback)
        self.dvl_sonar1_sub = rospy.Subscriber('dvl_sonar1', LaserScan, self.dvl_sonar1_callback)
        self.dvl_sonar2_sub = rospy.Subscriber('dvl_sonar2', LaserScan, self.dvl_sonar2_callback)
        self.dvl_sonar3_sub = rospy.Subscriber('dvl_sonar3', LaserScan, self.dvl_sonar3_callback)
        
        # Durum değişkenleri
        self.current_depth = 0.0
        self.target_depth = -10.0  # 10 metre derinlik
        self.current_altitude = 0.0  # Deniz tabanından yükseklik
        
        # Engel tespiti
        self.obstacle_distances = {
            'front': float('inf'),
            'back': float('inf'),
            'left': float('inf'),
            'right': float('inf')
        }
        
        # IMU verileri
        self.current_roll = 0.0
        self.current_pitch = 0.0
        self.current_yaw = 0.0
        self.angular_velocity = [0.0, 0.0, 0.0]
        
        # DVL verileri
        self.dvl_velocity = [0.0, 0.0, 0.0]
        self.dvl_altitude = 0.0
        self.dvl_valid = False
        
        # Kontrol parametreleri
        self.depth_kp = 1.0
        self.depth_kd = 0.3
        self.altitude_kp = 0.5
        self.yaw_kp = 0.8
        
        # Güvenlik parametreleri
        self.min_altitude = 2.0  # Deniz tabanından minimum 2m
        self.obstacle_threshold = 3.0  # Engel eşiği
        self.safe_distance = 5.0
        
        # Önceki değerler
        self.prev_depth_error = 0.0
        self.prev_time = rospy.Time.now()
        
        # Görev durumu
        self.mission_state = "DIVE"  # DIVE, NAVIGATE, HOVER, SURFACE
        self.target_yaw = 0.0
        
        # Waypoint navigation
        self.waypoints = [
            [10.0, 0.0, -10.0],   # x, y, z
            [10.0, 10.0, -10.0],
            [0.0, 10.0, -10.0],
            [0.0, 0.0, -10.0]
        ]
        self.current_waypoint_idx = 0
        self.waypoint_threshold = 2.0
        
        # Kontrol döngüsü
        self.control_timer = rospy.Timer(rospy.Duration(0.1), self.control_loop)
        
        rospy.loginfo("Gazebo Otonom Kontrol Sistemi başlatıldı!")
        rospy.loginfo(f"Hedef derinlik: {self.target_depth}m")
        
    def dvl_callback(self, msg):
        """DVL sensörü verilerini işle"""
        self.dvl_valid = msg.velocity_valid
        if self.dvl_valid:
            self.dvl_velocity = [msg.velocity.x, msg.velocity.y, msg.velocity.z]
            
        # Altitude bilgisi
        if hasattr(msg, 'altitude') and msg.altitude > 0:
            self.dvl_altitude = msg.altitude
            self.current_altitude = msg.altitude
            
    def dvl_twist_callback(self, msg):
        """DVL twist verilerini işle"""
        self.dvl_velocity = [
            msg.twist.linear.x,
            msg.twist.linear.y,
            msg.twist.linear.z
        ]
        
    def imu_callback(self, msg):
        """IMU verilerini işle"""
        # Quaternion'dan Euler açılarına çevir
        orientation_q = msg.orientation
        orientation_list = [orientation_q.x, orientation_q.y, orientation_q.z, orientation_q.w]
        (self.current_roll, self.current_pitch, self.current_yaw) = euler_from_quaternion(orientation_list)
        
        # Açısal hızlar
        self.angular_velocity = [
            msg.angular_velocity.x,
            msg.angular_velocity.y,
            msg.angular_velocity.z
        ]
        
    def pressure_callback(self, msg):
        """Basınç sensöründen derinlik hesapla"""
        # Gazebo'da basınç sensörü absolute pressure verir
        # Deniz seviyesi basıncı: ~101325 Pa
        # Su yoğunluğu: ~1025 kg/m³, g: 9.81 m/s²
        atmospheric_pressure = 101325.0
        water_density = 1025.0
        gravity = 9.81
        
        if msg.fluid_pressure > atmospheric_pressure:
            gauge_pressure = msg.fluid_pressure - atmospheric_pressure
            depth = gauge_pressure / (water_density * gravity)
            self.current_depth = -depth  # Negatif değer (aşağı doğru)
        else:
            self.current_depth = 0.0
            
    def dvl_sonar0_callback(self, msg):
        """DVL Sonar 0 (genellikle ön)"""
        if len(msg.ranges) > 0:
            valid_ranges = [r for r in msg.ranges if not np.isinf(r) and not np.isnan(r)]
            if valid_ranges:
                self.obstacle_distances['front'] = min(valid_ranges)
                
    def dvl_sonar1_callback(self, msg):
        """DVL Sonar 1 (genellikle sağ)"""
        if len(msg.ranges) > 0:
            valid_ranges = [r for r in msg.ranges if not np.isinf(r) and not np.isnan(r)]
            if valid_ranges:
                self.obstacle_distances['right'] = min(valid_ranges)
                
    def dvl_sonar2_callback(self, msg):
        """DVL Sonar 2 (genellikle arka)"""
        if len(msg.ranges) > 0:
            valid_ranges = [r for r in msg.ranges if not np.isinf(r) and not np.isnan(r)]
            if valid_ranges:
                self.obstacle_distances['back'] = min(valid_ranges)
                
    def dvl_sonar3_callback(self, msg):
        """DVL Sonar 3 (genellikle sol)"""
        if len(msg.ranges) > 0:
            valid_ranges = [r for r in msg.ranges if not np.isinf(r) and not np.isnan(r)]
            if valid_ranges:
                self.obstacle_distances['left'] = min(valid_ranges)
    
    def control_loop(self, event):
        """Ana kontrol döngüsü"""
        current_time = rospy.Time.now()
        dt = (current_time - self.prev_time).to_sec()
        
        if dt <= 0:
            return
            
        cmd = Twist()
        
        # Görev durumuna göre kontrol
        if self.mission_state == "DIVE":
            cmd = self.dive_control(dt)
            
        elif self.mission_state == "NAVIGATE":
            cmd = self.navigate_control(dt)
            
        elif self.mission_state == "HOVER":
            cmd = self.hover_control(dt)
            
        elif self.mission_state == "SURFACE":
            cmd = self.surface_control(dt)
        
        # Güvenlik kontrolleri
        cmd = self.apply_safety_limits(cmd)
        
        # Komutları gönder
        self.cmd_vel_pub.publish(cmd)
        
        # Durum güncellemeleri
        self.update_mission_state()
        
        self.prev_time = current_time
        
        # Debug bilgileri
        if rospy.get_time() % 3 < 0.1:  # Her 3 saniyede bir
            self.print_status()
    
    def dive_control(self, dt):
        """Dalış kontrolü"""
        cmd = Twist()
        
        # Derinlik kontrolü
        depth_error = self.target_depth - self.current_depth
        depth_derivative = (depth_error - self.prev_depth_error) / dt
        
        cmd.linear.z = self.depth_kp * depth_error + self.depth_kd * depth_derivative
        
        # Yaw stabilizasyonu
        yaw_error = self.normalize_angle(self.target_yaw - self.current_yaw)
        cmd.angular.z = self.yaw_kp * yaw_error
        
        self.prev_depth_error = depth_error
        
        return cmd
    
    def navigate_control(self, dt):
        """Navigasyon kontrolü"""
        cmd = Twist()
        
        # Waypoint navigation
        if self.current_waypoint_idx < len(self.waypoints):
            target_waypoint = self.waypoints[self.current_waypoint_idx]
            
            # Derinlik kontrolü
            depth_error = target_waypoint[2] - self.current_depth
            cmd.linear.z = self.depth_kp * depth_error * 0.5
            
            # Yaw kontrolü (hedefe yönelme)
            dx = target_waypoint[0]  # Basit navigasyon için
            dy = target_waypoint[1]
            target_yaw = math.atan2(dy, dx)
            
            yaw_error = self.normalize_angle(target_yaw - self.current_yaw)
            cmd.angular.z = self.yaw_kp * yaw_error
            
            # İleri hareket
            if abs(yaw_error) < 0.2:  # Yaw hatası küçükse ilerle
                cmd.linear.x = 0.5
            else:
                cmd.linear.x = 0.1  # Yavaş git
        
        # Engel kaçınma
        cmd = self.avoid_obstacles(cmd)
        
        return cmd
    
    def hover_control(self, dt):
        """Sabit pozisyon kontrolü"""
        cmd = Twist()
        
        # Derinlik sabit tutma
        depth_error = self.target_depth - self.current_depth
        cmd.linear.z = self.depth_kp * depth_error * 0.3
        
        # Yaw sabit tutma
        yaw_error = self.normalize_angle(self.target_yaw - self.current_yaw)
        cmd.angular.z = self.yaw_kp * yaw_error * 0.5
        
        # Hızı sıfırlama
        cmd.linear.x = -self.dvl_velocity[0] * 0.5
        cmd.linear.y = -self.dvl_velocity[1] * 0.5
        
        return cmd
    
    def surface_control(self, dt):
        """Yüzeye çıkma kontrolü"""
        cmd = Twist()
        
        if self.current_depth < -0.5:  # Henüz derinlikteyse
            cmd.linear.z = 0.3
        else:
            cmd.linear.z = 0.0
            
        return cmd
    
    def avoid_obstacles(self, cmd):
        """Engel kaçınma algoritması"""
        # Minimum engel mesafesi
        min_distance = min(self.obstacle_distances.values())
        
        if min_distance < self.obstacle_threshold:
            # Acil duruma geç
            cmd.linear.x = 0.0
            
            # En yakın engelin yönünü bul ve kaç
            if self.obstacle_distances['front'] == min_distance:
                cmd.linear.x = -0.2  # Geri git
                cmd.angular.z = 0.3   # Dön
            elif self.obstacle_distances['right'] == min_distance:
                cmd.angular.z = 0.3   # Sola dön
            elif self.obstacle_distances['left'] == min_distance:
                cmd.angular.z = -0.3  # Sağa dön
            elif self.obstacle_distances['back'] == min_distance:
                cmd.linear.x = 0.2    # İleri git
                
            rospy.logwarn(f"Engel tespit edildi! Minimum mesafe: {min_distance:.2f}m")
            
        elif min_distance < self.safe_distance:
            # Dikkatli hareket et
            cmd.linear.x = min(cmd.linear.x, 0.2)
            
        return cmd
    
    def apply_safety_limits(self, cmd):
        """Güvenlik sınırlarını uygula"""
        # Hız sınırları
        cmd.linear.x = max(-1.0, min(1.0, cmd.linear.x))
        cmd.linear.y = max(-1.0, min(1.0, cmd.linear.y))
        cmd.linear.z = max(-0.5, min(0.5, cmd.linear.z))
        cmd.angular.z = max(-0.5, min(0.5, cmd.angular.z))
        
        # Deniz tabanı koruması
        if self.current_altitude < self.min_altitude and self.current_altitude > 0:
            cmd.linear.z = max(0.0, cmd.linear.z)  # Aşağı gitme
            rospy.logwarn(f"Deniz tabanına çok yakın! Altitude: {self.current_altitude:.2f}m")
        
        return cmd
    
    def update_mission_state(self):
        """Görev durumunu güncelle"""
        if self.mission_state == "DIVE":
            if abs(self.current_depth - self.target_depth) < 1.0:
                self.mission_state = "NAVIGATE"
                rospy.loginfo("Hedef derinliğe ulaşıldı, navigasyon moduna geçiliyor...")
                
        elif self.mission_state == "NAVIGATE":
            # Waypoint kontrolü
            if self.current_waypoint_idx < len(self.waypoints):
                target = self.waypoints[self.current_waypoint_idx]
                distance = math.sqrt(target[0]**2 + target[1]**2)  # Basit mesafe
                if distance < self.waypoint_threshold:
                    self.current_waypoint_idx += 1
                    rospy.loginfo(f"Waypoint {self.current_waypoint_idx} tamamlandı!")
                    
            if self.current_waypoint_idx >= len(self.waypoints):
                self.mission_state = "HOVER"
                rospy.loginfo("Tüm waypoint'ler tamamlandı, hover moduna geçiliyor...")
    
    def normalize_angle(self, angle):
        """Açıyı -pi ile pi arasında normalize et"""
        while angle > math.pi:
            angle -= 2.0 * math.pi
        while angle < -math.pi:
            angle += 2.0 * math.pi
        return angle
    
    def print_status(self):
        """Durum bilgilerini yazdır"""
        rospy.loginfo("="*50)
        rospy.loginfo(f"Görev Durumu: {self.mission_state}")
        rospy.loginfo(f"Derinlik: {self.current_depth:.2f}m (Hedef: {self.target_depth:.2f}m)")
        rospy.loginfo(f"Altitude: {self.current_altitude:.2f}m")
        rospy.loginfo(f"Yaw: {math.degrees(self.current_yaw):.1f}°")
        rospy.loginfo(f"DVL Hız: [{self.dvl_velocity[0]:.2f}, {self.dvl_velocity[1]:.2f}, {self.dvl_velocity[2]:.2f}]")
        rospy.loginfo(f"Engel Mesafeleri: Ön:{self.obstacle_distances['front']:.1f}m")
        rospy.loginfo(f"Waypoint: {self.current_waypoint_idx}/{len(self.waypoints)}")

if __name__ == '__main__':
    try:
        controller = GazeboAutonomousController()
        rospy.spin()
    except rospy.ROSInterruptException:
        rospy.loginfo("Otonom kontrol sistemi durduruldu.")
