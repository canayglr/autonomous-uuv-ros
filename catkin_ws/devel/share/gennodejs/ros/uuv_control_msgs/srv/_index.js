
"use strict";

let SwitchToManual = require('./SwitchToManual.js')
let SetPIDParams = require('./SetPIDParams.js')
let GetPIDParams = require('./GetPIDParams.js')
let AddWaypoint = require('./AddWaypoint.js')
let GetWaypoints = require('./GetWaypoints.js')
let StartTrajectory = require('./StartTrajectory.js')
let GoToIncremental = require('./GoToIncremental.js')
let SwitchToAutomatic = require('./SwitchToAutomatic.js')
let SetMBSMControllerParams = require('./SetMBSMControllerParams.js')
let InitWaypointSet = require('./InitWaypointSet.js')
let InitWaypointsFromFile = require('./InitWaypointsFromFile.js')
let SetSMControllerParams = require('./SetSMControllerParams.js')
let ClearWaypoints = require('./ClearWaypoints.js')
let GetMBSMControllerParams = require('./GetMBSMControllerParams.js')
let InitHelicalTrajectory = require('./InitHelicalTrajectory.js')
let InitRectTrajectory = require('./InitRectTrajectory.js')
let ResetController = require('./ResetController.js')
let GetSMControllerParams = require('./GetSMControllerParams.js')
let IsRunningTrajectory = require('./IsRunningTrajectory.js')
let InitCircularTrajectory = require('./InitCircularTrajectory.js')
let GoTo = require('./GoTo.js')
let Hold = require('./Hold.js')

module.exports = {
  SwitchToManual: SwitchToManual,
  SetPIDParams: SetPIDParams,
  GetPIDParams: GetPIDParams,
  AddWaypoint: AddWaypoint,
  GetWaypoints: GetWaypoints,
  StartTrajectory: StartTrajectory,
  GoToIncremental: GoToIncremental,
  SwitchToAutomatic: SwitchToAutomatic,
  SetMBSMControllerParams: SetMBSMControllerParams,
  InitWaypointSet: InitWaypointSet,
  InitWaypointsFromFile: InitWaypointsFromFile,
  SetSMControllerParams: SetSMControllerParams,
  ClearWaypoints: ClearWaypoints,
  GetMBSMControllerParams: GetMBSMControllerParams,
  InitHelicalTrajectory: InitHelicalTrajectory,
  InitRectTrajectory: InitRectTrajectory,
  ResetController: ResetController,
  GetSMControllerParams: GetSMControllerParams,
  IsRunningTrajectory: IsRunningTrajectory,
  InitCircularTrajectory: InitCircularTrajectory,
  GoTo: GoTo,
  Hold: Hold,
};
