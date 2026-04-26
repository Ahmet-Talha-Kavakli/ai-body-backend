import ExpoModulesCore
import ReplayKit

public class FlyoverRecorderModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FlyoverRecorder")

    AsyncFunction("startRecording") { (promise: Promise) in
      let recorder = RPScreenRecorder.shared()
      recorder.isMicrophoneEnabled = false
      guard recorder.isAvailable else {
        promise.reject("recording_unavailable", "Screen recording is not available on this device.")
        return
      }
      recorder.startRecording { error in
        if let error = error {
          promise.reject("recording_start_error", error.localizedDescription)
          return
        }
        promise.resolve(nil)
      }
    }

    AsyncFunction("stopRecording") { (promise: Promise) in
      let recorder = RPScreenRecorder.shared()
      let outputURL = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        .appendingPathComponent("flyover-\(Int(Date().timeIntervalSince1970)).mp4")
      // Best-effort: clear any stale file at this URL
      try? FileManager.default.removeItem(at: outputURL)

      if #available(iOS 14.0, *) {
        recorder.stopRecording(withOutput: outputURL) { error in
          if let error = error {
            promise.reject("recording_stop_error", error.localizedDescription)
            return
          }
          promise.resolve(["uri": outputURL.absoluteString])
        }
      } else {
        promise.reject("recording_unsupported", "iOS 14.0+ required for direct MP4 capture.")
      }
    }

    AsyncFunction("isAvailable") { () -> Bool in
      return RPScreenRecorder.shared().isAvailable
    }
  }
}
