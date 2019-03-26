const EventEmitter = require('events');
const SensorTag = require('sensortag');
const MovingAverage = require('moving-average');
const logger = require('./logger');


const accelerometerPeriod = 200;
const accelerometerPrecision = 2;
const luxometerPeriod = 200;
const luxometerPrecision = 2;
const movingAverageTimeInterval = 2000;
const accelerometerUpdateMinInterval = 100;
const magnetometerPeriod = 200;
const magnetometerPrecision = 2;

var safeCallback = function(callback) {
  if (typeof callback == 'function') {
    callback()
  }
}

class Sensor extends EventEmitter {

  constructor(sensorTag){
    super();
    this.sensorTag = sensorTag;
    this.hasAddedListeners = false;
    this.hasStarted = false;
    this.leftButtonPressed = false;
    this.rightButtonPressed = false;
    this.addListeners();
    this.accelerometerUpdateTimestamp=0;
    this.movingAverageX = MovingAverage(movingAverageTimeInterval)
    this.movingAverageY = MovingAverage(movingAverageTimeInterval)
    this.movingAverageZ = MovingAverage(movingAverageTimeInterval)
  }

  getId() {
    return this.sensorTag.uuid;
  }

  addListeners() {
    var _this = this;
    if (this.hasAddedListeners) {
      return;
    }
    this.hasAddedListeners = true;
    this.sensorTag.on('accelerometerChange', (x, y, z) => {
      var timestamp = Date.now();
      this.movingAverageX.push(timestamp, x);
      this.movingAverageY.push(timestamp, y);
      this.movingAverageZ.push(timestamp, z);
      // if (timestamp - this.accelerometerUpdateTimestamp > accelerometerUpdateMinInterval) {
        this.accelerometerUpdateTimestamp = timestamp;
        x = this.movingAverageX.movingAverage().toFixed(accelerometerPrecision);
        y = this.movingAverageY.movingAverage().toFixed(accelerometerPrecision);
        z = this.movingAverageZ.movingAverage().toFixed(accelerometerPrecision);
        logger.debug('Sensor - on accelerometerChange', x, y, z);
        _this.emit("accelerometerChange", x, y, z);
      // }
    });

    this.sensorTag.on('magnetometerChange', (x, y, z) => {
      logger.debug('Sensor - on magnetometerChange', x, y, z);
      x = x.toFixed(accelerometerPrecision);
      y = y.toFixed(accelerometerPrecision);
      z = z.toFixed(accelerometerPrecision);
      _this.emit("magnetometerChange", x, y, z);
    });

    this.sensorTag.on('luxometerChange', (lux) => {
      logger.debug('Sensor - on luxometerChange', lux);
      lux = lux.toFixed(luxometerPrecision);
      _this.emit("luxometerChange", lux);
    });

    this.sensorTag.on('simpleKeyChange', function(left, right, reedRelay) {
      // console.log(this.id, this.uuid, left, right, reedRelay);
      logger.debug('Sensor - on simpleKeyChange');
      if (right) {
        _this.emit("buttonPress");
      }
    });
  }

  start() {
    var _this = this;
    if (this.hasStarted) {
      return;
    }
    this.hasStarted = true;

    // accelerometer
    this.sensorTag.enableAccelerometer(function(error) {
      logger.debug('Sensor.start - set enableAccelerometer');
      if (error) {
        console.error(error);
      }
      _this.sensorTag.setAccelerometerPeriod(accelerometerPeriod, function(error) {
        logger.debug('Sensor.start - set accelerometerPeriod');
        if (error) {
          logger.error(error);
        }
        _this.sensorTag.notifyAccelerometer(function(error) {
          console.log('Sensor.start - set notifyAccelerometer');
          if (error) {
            logger.error(error);
          }
        });
      });
    });

    this.sensorTag.notifySimpleKey(function(error){
      logger.debug('Sensor.start - set notifySimpleKey');
      if (error) {
        logger.error(error);
      }
    });

    this.sensorTag.enableMagnetometer(function(error){
      logger.debug('Sensor.start - set enableMagnetometer');
      if (error) {
        console.error(error);
      }
      _this.sensorTag.setMagnetometerPeriod(magnetometerPeriod, function(error) {
        logger.debug('Sensor.start - set magnetometerPeriod');
        if (error) {
          logger.error(error);
        }
        // CC2540: period 1 - 2550 ms, default period is 2000 ms
        // CC2650: period 100 - 2550 ms, default period is 1000 ms
        _this.sensorTag.notifyMagnetometer(function(error) {
          console.log('Sensor.start - set notifyMagnetometer');
          if (error) {
            logger.error(error);
          }
        });
      });
    });

    this.sensorTag.enableLuxometer(function(error) {
      logger.debug('Sensor.start - set enableLuxometer');
      if (error) {
        console.error(error);
      }
      _this.sensorTag.setLuxometerPeriod(luxometerPeriod, function(error) {
        logger.debug('Sensor.start - set luxometerPeriod');
        if (error) {
          logger.error(error);
        }
        _this.sensorTag.notifyLuxometer(function(error) {
          console.log('Sensor.start - set notifyLuxometer');
          if (error) {
            logger.error(error);
          }
        });
      });
    });

    _this.sensorTag.notifySimpleKey(function(error){
      logger.debug('Sensor.start - set notifySimpleKey');
      if (error) {
        logger.error(error);
      }
    });
  }

  stop(callback) {
    this.sensorTag.unnotifyAccelerometer(safeCallback(callback));
    this.sensorTag.unnotifyMagnetometer(safeCallback(callback));
    this.sensorTag.unnotifyLuxometer(safeCallback(callback));
  }
}


module.exports = Sensor;
