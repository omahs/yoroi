/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/jest.config.js'
    },
    jest: {
      setupTimeout: 120000
    }
  },  
  apps: {
    'ios.yoroi.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/yoroi.app',
      build: 'xcodebuild -workspace ios/yoroi.xcworkspace -scheme yoroi -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'ios.nightly.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/nightly.app',
      build: 'xcodebuild -workspace ios/yoroi.xcworkspace -scheme nightly -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'ios.nightly.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/nightly.app',
      build: 'xcodebuild -workspace ios/yoroi.xcworkspace -scheme nightly -configuration Release -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'android.dev.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/dev/debug/app-dev-debug.apk',
      build: 'ENVFILE=.env cd android && ./gradlew assembleDevDebug assembleDevDebugAndroidTest -DtestBuildType=debug',
      reversePorts: [
        8081
      ]
    },    
    'android.nightly.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/nightly/debug/app-nightly-debug.apk',
      build: 'ENVFILE=.env.nightly cd android && ./gradlew assembleNightlyDebug assembleNightlyDebugAndroidTest -DtestBuildType=debug',
      reversePorts: [
        8081
      ]
    },
    'android.nightly.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/nightly/release/app-nightly-release.apk',
      build: 'ENVFILE=.env.nightly cd android && ./gradlew assembleNightlyRelease assembleNightlyReleaseAndroidTest -DtestBuildType=release',
      reversePorts: [
        8081
      ]
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14'
      }
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: '.*'
      }
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_3_e2e'
      }
    }
  },
  configurations: {
    'ios.sim.yoroi.debug': {
      device: 'simulator',
      app: 'ios.yoroi.debug'
    },
    'ios.sim.nightly.debug': {
      device: 'simulator',
      app: 'ios.nightly.debug'
    },
    'ios.sim.nightly.release': {
      device: 'simulator',
      app: 'ios.nightly.release'
    },
    'android.att.debug': {
      device: 'attached',
      app: 'android.debug'
    },
    'android.att.release': {
      device: 'attached',
      app: 'android.release'
    },
    'android.emu.dev.debug': {
      device: 'emulator',
      app: 'android.dev.debug'
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release'
    },
    'android.emu.nightly.debug': {
      device: 'emulator',
      app: 'android.nightly.debug'
    },
    'android.emu.nightly.release': {
      device: 'emulator',
      app: 'android.nightly.release'
    },
    'android.att.nightly.release': {
      device: 'attached',
      app: 'android.nightly.release'
    }
  }
};
