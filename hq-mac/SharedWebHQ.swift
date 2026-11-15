import SwiftUI
import WebKit

/// Shared server-rendered HQ inside the existing native workspace.
/// No provider keys or native operator tokens are injected into web content.
struct SharedWebHQ: View {
    @State private var generation = UUID()
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Web founder sign-in is separate from unlocking this Mac.").font(.caption).foregroundStyle(.secondary)
                Spacer()
                Button("Reload / sign out of web session") { generation = UUID() }
                Link("Open in browser", destination: HQWebView.origin)
            }
            HQWebView().id(generation)
        }
    }
}
struct HQWebView: NSViewRepresentable {
    static let origin = URL(string: "https://hq.karpilo-liq.com")!
    func makeCoordinator() -> Coordinator { Coordinator() }
    func makeNSView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.navigationDelegate = context.coordinator
        view.load(URLRequest(url: Self.origin))
        return view
    }
    func updateNSView(_ view: WKWebView, context: Context) {}
    static func dismantleNSView(_ view: WKWebView, coordinator: Coordinator) {
        view.stopLoading()
        view.navigationDelegate = nil
        coordinator.active = false
        if let alert = coordinator.alert { alert.window.sheetParent?.endSheet(alert.window) }
    }
    final class Coordinator: NSObject, WKNavigationDelegate {
        var active = true
        var alert: NSAlert?
        private func allowed(_ url: URL?) -> Bool {
            guard let url else { return false }
            let hosts = [HQWebView.origin.host!, "vercel.com", "github.com", "accounts.google.com"]
            return url.scheme == "https" && hosts.contains(url.host ?? "") && (url.port == nil || url.port == 443) && url.user == nil && url.password == nil
        }
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            decisionHandler(allowed(navigationAction.request.url) ? .allow : .cancel)
        }
        func webView(_ webView: WKWebView, didReceive challenge: URLAuthenticationChallenge, completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
            let space = challenge.protectionSpace
            guard space.authenticationMethod == NSURLAuthenticationMethodHTTPBasic else {
                completionHandler(.performDefaultHandling, nil); return
            }
            guard active, space.host == HQWebView.origin.host, space.protocol == "https", space.port == 443, challenge.previousFailureCount < 3, let window = webView.window else {
                completionHandler(.cancelAuthenticationChallenge, nil); return
            }
            let dialog = NSAlert()
            dialog.messageText = "Sign in to Karpilo LoadIQ HQ"
            dialog.informativeText = "Credentials go only to hq.karpilo-liq.com over HTTPS. They are not saved to disk."
            dialog.addButton(withTitle: "Sign in"); dialog.addButton(withTitle: "Cancel")
            let user = NSTextField(frame: NSRect(x: 0, y: 40, width: 300, height: 24)); user.placeholderString = "Founder username"
            let password = NSSecureTextField(frame: NSRect(x: 0, y: 0, width: 300, height: 24)); password.placeholderString = "Founder password"
            let fields = NSView(frame: NSRect(x: 0, y: 0, width: 300, height: 70))
            fields.addSubview(user); fields.addSubview(password); dialog.accessoryView = fields
            alert = dialog
            dialog.beginSheetModal(for: window) { [weak self] response in
                self?.alert = nil
                guard self?.active == true, response == .alertFirstButtonReturn else {
                    completionHandler(.cancelAuthenticationChallenge, nil); return
                }
                let credential = URLCredential(user: user.stringValue, password: password.stringValue, persistence: .none)
                password.stringValue = ""
                completionHandler(.useCredential, credential)
            }
        }
    }
}
