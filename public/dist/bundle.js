/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/app.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/app.js":
/*!********************!*\
  !*** ./src/app.js ***!
  \********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("﻿var config = {\n  type: Phaser.AUTO,\n  parent: \"phaser-example\",\n  width: window.innerWidth,\n  height: window.innerHeight,\n  physics: {\n    default: \"arcade\",\n    arcade: {\n      fps: 60,\n      gravity: {\n        y: 0\n      }\n    }\n  },\n  scene: {\n    preload: preload,\n    create: create,\n    update: update\n  }\n};\n\nvar ship;\nvar proShip;\nvar cursors;\nvar gameTime;\n\nvar shipDetails;\n\nvar bullets;\nvar spaceBar;\n\nfunction fireBullet() {}\n\nvar game = new Phaser.Game(config);\n\nfunction preload() {\n  this.load.image(\"bullet\", \"assets/bullets.png\");\n  this.load.image(\"ship\", \"assets/ship.png\");\n  this.load.image(\"proShip\", \"assets/shipWithBlaster.png\");\n}\n\nfunction create() {\n  // spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);\n\n  ship = this.physics.add.sprite(\n    window.innerWidth / 2,\n    window.innerHeight / 2,\n    \"ship\"\n  );\n\n  ship.setDamping(true);\n  ship.angle = -90;\n  ship.setDrag(0.95);\n  ship.setMaxVelocity(200);\n\n  proShip = this.physics.add.sprite(window.innerWidth / 3, 300, \"proShip\");\n\n  proShip.setDamping(true);\n  proShip.angle = -90;\n  proShip.setDrag(0.95);\n  proShip.setMaxVelocity(200);\n\n  // bullets = scene.plugins.get('rexBullet').add(\"ship\", {\n  //   speed: 200,\n  //   enable: true\n  // });\n\n  cursors = this.input.keyboard.createCursorKeys();\n\n  shipDetails = this.add.text(10, 10, \"\", {\n    font: \"16px Courier\",\n    fill: \"#00ff00\"\n  });\n\n  gameTime = this.add.text(10, 70, \"\", {\n    font: \"16px Courier\",\n    fill: \"#00ff00\"\n  });\n}\n\n// software joystick\n// var up = document.getElementById(\"up\");\n// var left = document.getElementById(\"left\");\n// var right = document.getElementById(\"right\");\n\n// up.addEventListener(\"click\", function() {});\n// left.addEventListener(\"click\", function() {});\n// right.addEventListener(\"click\", function() {});\n\nfunction update() {\n  if (cursors.up.isDown) {\n    this.physics.velocityFromRotation(\n      ship.rotation,\n      200,\n      ship.body.acceleration\n    );\n  } else {\n    ship.setAcceleration(0);\n  }\n  if (cursors.left.isDown) {\n    ship.setAngularVelocity(-300);\n  } else if (cursors.right.isDown) {\n    ship.setAngularVelocity(300);\n  } else {\n    ship.setAngularVelocity(0);\n  }\n\n  shipDetails.setText(\"Welcome to Trinveders[ALPHA]\");\n\n  // gameTime.setText(\"Game Time: \" + this.time.now);\n\n  this.physics.world.wrap(ship, 32);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvYXBwLmpzLmpzIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vLy4vc3JjL2FwcC5qcz8xMTEyIl0sInNvdXJjZXNDb250ZW50IjpbIu+7v3ZhciBjb25maWcgPSB7XG4gIHR5cGU6IFBoYXNlci5BVVRPLFxuICBwYXJlbnQ6IFwicGhhc2VyLWV4YW1wbGVcIixcbiAgd2lkdGg6IHdpbmRvdy5pbm5lcldpZHRoLFxuICBoZWlnaHQ6IHdpbmRvdy5pbm5lckhlaWdodCxcbiAgcGh5c2ljczoge1xuICAgIGRlZmF1bHQ6IFwiYXJjYWRlXCIsXG4gICAgYXJjYWRlOiB7XG4gICAgICBmcHM6IDYwLFxuICAgICAgZ3Jhdml0eToge1xuICAgICAgICB5OiAwXG4gICAgICB9XG4gICAgfVxuICB9LFxuICBzY2VuZToge1xuICAgIHByZWxvYWQ6IHByZWxvYWQsXG4gICAgY3JlYXRlOiBjcmVhdGUsXG4gICAgdXBkYXRlOiB1cGRhdGVcbiAgfVxufTtcblxudmFyIHNoaXA7XG52YXIgcHJvU2hpcDtcbnZhciBjdXJzb3JzO1xudmFyIGdhbWVUaW1lO1xuXG52YXIgc2hpcERldGFpbHM7XG5cbnZhciBidWxsZXRzO1xudmFyIHNwYWNlQmFyO1xuXG5mdW5jdGlvbiBmaXJlQnVsbGV0KCkge31cblxudmFyIGdhbWUgPSBuZXcgUGhhc2VyLkdhbWUoY29uZmlnKTtcblxuZnVuY3Rpb24gcHJlbG9hZCgpIHtcbiAgdGhpcy5sb2FkLmltYWdlKFwiYnVsbGV0XCIsIFwiYXNzZXRzL2J1bGxldHMucG5nXCIpO1xuICB0aGlzLmxvYWQuaW1hZ2UoXCJzaGlwXCIsIFwiYXNzZXRzL3NoaXAucG5nXCIpO1xuICB0aGlzLmxvYWQuaW1hZ2UoXCJwcm9TaGlwXCIsIFwiYXNzZXRzL3NoaXBXaXRoQmxhc3Rlci5wbmdcIik7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZSgpIHtcbiAgLy8gc3BhY2VCYXIgPSB0aGlzLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuSW5wdXQuS2V5Ym9hcmQuS2V5Q29kZXMuU1BBQ0UpO1xuXG4gIHNoaXAgPSB0aGlzLnBoeXNpY3MuYWRkLnNwcml0ZShcbiAgICB3aW5kb3cuaW5uZXJXaWR0aCAvIDIsXG4gICAgd2luZG93LmlubmVySGVpZ2h0IC8gMixcbiAgICBcInNoaXBcIlxuICApO1xuXG4gIHNoaXAuc2V0RGFtcGluZyh0cnVlKTtcbiAgc2hpcC5hbmdsZSA9IC05MDtcbiAgc2hpcC5zZXREcmFnKDAuOTUpO1xuICBzaGlwLnNldE1heFZlbG9jaXR5KDIwMCk7XG5cbiAgcHJvU2hpcCA9IHRoaXMucGh5c2ljcy5hZGQuc3ByaXRlKHdpbmRvdy5pbm5lcldpZHRoIC8gMywgMzAwLCBcInByb1NoaXBcIik7XG5cbiAgcHJvU2hpcC5zZXREYW1waW5nKHRydWUpO1xuICBwcm9TaGlwLmFuZ2xlID0gLTkwO1xuICBwcm9TaGlwLnNldERyYWcoMC45NSk7XG4gIHByb1NoaXAuc2V0TWF4VmVsb2NpdHkoMjAwKTtcblxuICAvLyBidWxsZXRzID0gc2NlbmUucGx1Z2lucy5nZXQoJ3JleEJ1bGxldCcpLmFkZChcInNoaXBcIiwge1xuICAvLyAgIHNwZWVkOiAyMDAsXG4gIC8vICAgZW5hYmxlOiB0cnVlXG4gIC8vIH0pO1xuXG4gIGN1cnNvcnMgPSB0aGlzLmlucHV0LmtleWJvYXJkLmNyZWF0ZUN1cnNvcktleXMoKTtcblxuICBzaGlwRGV0YWlscyA9IHRoaXMuYWRkLnRleHQoMTAsIDEwLCBcIlwiLCB7XG4gICAgZm9udDogXCIxNnB4IENvdXJpZXJcIixcbiAgICBmaWxsOiBcIiMwMGZmMDBcIlxuICB9KTtcblxuICBnYW1lVGltZSA9IHRoaXMuYWRkLnRleHQoMTAsIDcwLCBcIlwiLCB7XG4gICAgZm9udDogXCIxNnB4IENvdXJpZXJcIixcbiAgICBmaWxsOiBcIiMwMGZmMDBcIlxuICB9KTtcbn1cblxuLy8gc29mdHdhcmUgam95c3RpY2tcbi8vIHZhciB1cCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidXBcIik7XG4vLyB2YXIgbGVmdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibGVmdFwiKTtcbi8vIHZhciByaWdodCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmlnaHRcIik7XG5cbi8vIHVwLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbigpIHt9KTtcbi8vIGxlZnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge30pO1xuLy8gcmlnaHQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge30pO1xuXG5mdW5jdGlvbiB1cGRhdGUoKSB7XG4gIGlmIChjdXJzb3JzLnVwLmlzRG93bikge1xuICAgIHRoaXMucGh5c2ljcy52ZWxvY2l0eUZyb21Sb3RhdGlvbihcbiAgICAgIHNoaXAucm90YXRpb24sXG4gICAgICAyMDAsXG4gICAgICBzaGlwLmJvZHkuYWNjZWxlcmF0aW9uXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICBzaGlwLnNldEFjY2VsZXJhdGlvbigwKTtcbiAgfVxuICBpZiAoY3Vyc29ycy5sZWZ0LmlzRG93bikge1xuICAgIHNoaXAuc2V0QW5ndWxhclZlbG9jaXR5KC0zMDApO1xuICB9IGVsc2UgaWYgKGN1cnNvcnMucmlnaHQuaXNEb3duKSB7XG4gICAgc2hpcC5zZXRBbmd1bGFyVmVsb2NpdHkoMzAwKTtcbiAgfSBlbHNlIHtcbiAgICBzaGlwLnNldEFuZ3VsYXJWZWxvY2l0eSgwKTtcbiAgfVxuXG4gIHNoaXBEZXRhaWxzLnNldFRleHQoXCJXZWxjb21lIHRvIFRyaW52ZWRlcnNbQUxQSEFdXCIpO1xuXG4gIC8vIGdhbWVUaW1lLnNldFRleHQoXCJHYW1lIFRpbWU6IFwiICsgdGhpcy50aW1lLm5vdyk7XG5cbiAgdGhpcy5waHlzaWNzLndvcmxkLndyYXAoc2hpcCwgMzIpO1xufVxuIl0sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOyIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./src/app.js\n");

/***/ })

/******/ });