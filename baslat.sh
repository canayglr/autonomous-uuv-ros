#!/bin/bash

# 1. Gazebo su altı dünyasını başlat
roslaunch uuv_gazebo_worlds empty_underwater_world.launch &
sleep 2  # az bir bekleme veriyoruz ki ros master başlasın

# 2. REXROV robotunu yükle
roslaunch uuv_descriptions upload_rexrov.launch mode:=default x:=0 y:=0 z:=-20 namespace:=rexrov &
sleep 5  # robotun tam olarak yüklenmesi için bekle

# 3. Kontrol sistemini başlat
roslaunch uuv_control_cascaded_pid key_board_velocity.launch uuv_name:=rexrov model_name:=rexrov

