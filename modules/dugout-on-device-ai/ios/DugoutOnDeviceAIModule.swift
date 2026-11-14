import ExpoModulesCore
import Foundation
#if canImport(FoundationModels)
import FoundationModels
#endif

public final class DugoutOnDeviceAIModule: Module {
  private var generationTask: Task<Void, Never>?
  private var activeRequestId: String?

  public func definition() -> ModuleDefinition {
    Name("DugoutOnDeviceAI")

    AsyncFunction("getAvailability") { () -> [String: String] in
      self.availability()
    }.runOnQueue(.main)

    AsyncFunction("generate") { (requestId: String, instructions: String, prompt: String, promise: Promise) in
      guard self.generationTask == nil else {
        promise.reject("ERR_BUSY", "The previous local answer is still stopping. Try again shortly.")
        return
      }
      guard !requestId.isEmpty, requestId.count <= 80,
            !prompt.isEmpty, prompt.count <= 7800, instructions.count <= 1800 else {
        promise.reject("ERR_INPUT", "The local question is too long.")
        return
      }
      let state = self.availability()
      guard state["status"] == "available" else {
        promise.reject("ERR_UNAVAILABLE", state["message"] ?? "On-device AI is unavailable.")
        return
      }
      #if canImport(FoundationModels)
      if #available(iOS 26.0, *) {
        self.activeRequestId = requestId
        self.generationTask = Task { @MainActor in
          defer {
            if self.activeRequestId == requestId {
              self.activeRequestId = nil
              self.generationTask = nil
            }
          }
          do {
            try Task.checkCancellation()
            // SystemLanguageModel.default is explicitly Apple's ON-DEVICE model.
            // There are no remote adapters, network tools, or cloud fallbacks.
            let session = LanguageModelSession(model: SystemLanguageModel.default, instructions: instructions)
            let response = try await session.respond(
              to: prompt,
              options: GenerationOptions(temperature: 0.1, maximumResponseTokens: 600)
            )
            try Task.checkCancellation()
            promise.resolve(response.content)
          } catch is CancellationError {
            promise.reject("ERR_CANCELLED", "Answer stopped.")
          } catch {
            promise.reject("ERR_LOCAL_MODEL", "The on-device model could not finish this answer. Saved Rules are still available.")
          }
        }
      } else {
        promise.reject("ERR_UNAVAILABLE", "On-device AI requires iOS 26 or later.")
      }
      #else
      promise.reject("ERR_BUILD", "Build the app with Xcode 26 or later to include on-device AI.")
      #endif
    }.runOnQueue(.main)

    AsyncFunction("cancel") { (requestId: String) -> Bool in
      guard self.activeRequestId == requestId else { return false }
      self.generationTask?.cancel()
      return true
    }.runOnQueue(.main)

    OnDestroy {
      self.generationTask?.cancel()
    }
  }

  private func availability() -> [String: String] {
    #if canImport(FoundationModels)
    if #available(iOS 26.0, *) {
      switch SystemLanguageModel.default.availability {
      case .available:
        return ["status": "available", "message": "Apple Intelligence is ready. Answers run on this device."]
      case .unavailable(.deviceNotEligible):
        return ["status": "device-not-eligible", "message": "This device does not support Apple's on-device model. Use Saved Rules."]
      case .unavailable(.appleIntelligenceNotEnabled):
        return ["status": "disabled", "message": "Turn on Apple Intelligence in Settings, then check again."]
      case .unavailable(.modelNotReady):
        return ["status": "model-not-ready", "message": "Apple's model is downloading or not ready. Connect to Wi-Fi for setup, then check again."]
      case .unavailable:
        return ["status": "unavailable", "message": "Apple Intelligence is unavailable for this device, language, or region. Use Saved Rules."]
      @unknown default:
        return ["status": "unavailable", "message": "Apple Intelligence is unavailable. Use Saved Rules."]
      }
    }
    return ["status": "os-not-supported", "message": "On-device AI requires iOS 26 or later. Saved Rules still work."]
    #else
    return ["status": "build-not-supported", "message": "Build with Xcode 26 or later to include Apple Foundation Models. Saved Rules still work."]
    #endif
  }
}
