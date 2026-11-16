import SwiftUI
import LocalAuthentication

/// Local workstation protection only. Backend operator authorization is enforced separately.
struct OperatorLock: View {
    @State private var unlocked = false
    @State private var authenticating = false
    @State private var error = ""
    @State private var context: LAContext?
    @Environment(\.scenePhase) private var phase
    var body: some View {
        Group {
            if unlocked {
                HQWorkspace().toolbar {
                    Button(action: lock) { Label("Lock HQ", systemImage: "lock.fill") }
                }
            } else {
                VStack(spacing: 20) {
                    if let url = Bundle.main.url(forResource: "HQBrand", withExtension: "png"), let image = NSImage(contentsOf: url) {
                        Image(nsImage: image).resizable().scaledToFit().frame(width: 220, height: 220).clipShape(RoundedRectangle(cornerRadius: 30))
                    }
                    Text("LOADIQ HQ").font(.system(size: 34, weight: .black, design: .rounded))
                    Text("Unlock this Mac’s operator workspace")
                    Text("Use Touch ID or your Mac password. Customer sign-in is separate.").foregroundStyle(.secondary)
                    Button(authenticating ? "Authenticating…" : "Unlock HQ") { authenticate() }.disabled(authenticating)
                    Text(error).foregroundStyle(.red)
                    Text("Email sending is disabled").foregroundStyle(.orange)
                }.padding(40).frame(minWidth: 900, minHeight: 700).frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(LinearGradient(colors: [Color(red: 0.12, green: 0.015, blue: 0.025), .black], startPoint: .topLeading, endPoint: .bottomTrailing))
            }
        }.preferredColorScheme(.dark).tint(.red).onChange(of: phase) { value in
            if value == .background { lock() }
        }.onReceive(NSWorkspace.shared.notificationCenter.publisher(for: NSWorkspace.sessionDidResignActiveNotification)) { _ in lock() }
    }
    private func lock() {
        context?.invalidate(); context = nil; unlocked = false; authenticating = false
    }
    private func authenticate() {
        let attempt = LAContext()
        var failure: NSError?
        guard attempt.canEvaluatePolicy(.deviceOwnerAuthentication, error: &failure) else {
            error = "Mac authentication is unavailable. HQ remains locked."; return
        }
        context = attempt; authenticating = true; error = ""
        attempt.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: "Unlock the LoadIQ operator workspace") { success, _ in
            DispatchQueue.main.async {
                guard context === attempt else { return }
                authenticating = false; unlocked = success
                if !success { error = "Authentication was cancelled or unsuccessful." }
            }
        }
    }
}
