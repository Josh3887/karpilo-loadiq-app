import SwiftUI
import AuthenticationServices
import CryptoKit
import Security

private final class HQPresentationAnchor: NSObject, ASWebAuthenticationPresentationContextProviding {
    private let window: ASPresentationAnchor
    init(window: ASPresentationAnchor) { self.window = window }
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor { window }
}

@MainActor final class RemoteSession: NSObject, ObservableObject {
    @Published var accessToken: String?
    @Published var message = "Operator enrollment and hosted login configuration pending"
    @Published var busy = false
    private var session: ASWebAuthenticationSession?
    private var expires: Date?
    private var attemptID = UUID()
    private let client = "1kcpiqvjpo6ck6pl2f7k595ddn"
    private let callback = "loadiqhq://auth"
    // Capture the window on the main actor before starting AuthenticationServices.
    // The synchronous delegate only returns that retained window reference.
    private var presentationProvider: HQPresentationAnchor?
    func signOut() { attemptID = UUID(); busy = false; session?.cancel(); session = nil; accessToken = nil; expires = nil; message = "Signed out of HQ" }
    func token() throws -> String {
        guard let token = accessToken, let expiry = expires, expiry > Date() else { signOut(); throw URLError(.userAuthenticationRequired) }
        return token
    }
    func readGateway(_ path: String) async throws -> Data {
        let saved = UserDefaults.standard.string(forKey: "hq.operatorAPI") ?? ""
        var configured = saved
        if configured.isEmpty, let file = Bundle.main.url(forResource: "OperatorConnection", withExtension: "json"),
           let data = try? Data(contentsOf: file), let settings = try? JSONDecoder().decode([String:String].self, from: data) { configured = settings["api"] ?? "" }
        guard let base = URL(string: configured), base.scheme == "https", base.host != nil, base.user == nil, base.password == nil, base.query == nil, base.fragment == nil else {
            throw NSError(domain: "HQGateway", code: 1, userInfo: [NSLocalizedDescriptionKey: "Configure the deployed operator service in Integrations before syncing."])
        }
        let bearer = try token()
        var request = URLRequest(url: base.appendingPathComponent(path))
        request.setValue("Bearer " + bearer, forHTTPHeaderField: "Authorization")
        request.timeoutInterval = 15
        let client = URLSession(configuration: .ephemeral, delegate: NoRedirect(), delegateQueue: nil)
        defer { client.invalidateAndCancel() }
        let (data, response) = try await client.data(for: request)
        guard bearer == accessToken else { throw URLError(.userAuthenticationRequired) }
        guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw URLError(.badServerResponse) }
        return data
    }
    private func random() throws -> String {
        var bytes = [UInt8](repeating: 0, count: 32)
        guard SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes) == errSecSuccess else { throw URLError(.unknown) }
        return encode(Data(bytes))
    }
    private func encode(_ data: Data) -> String { data.base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "") }
    func signIn(domain: URL) {
        guard !busy, domain.scheme == "https", domain.host?.hasSuffix(".auth.us-east-2.amazoncognito.com") == true else { return }
        do {
            let verifier = try random(), state = try random()
            let attempt = UUID(); attemptID = attempt
            let challenge = encode(Data(SHA256.hash(data: Data(verifier.utf8))))
            var url = URLComponents(url: domain.appendingPathComponent("oauth2/authorize"), resolvingAgainstBaseURL: false)!
            url.queryItems = [URLQueryItem(name:"client_id",value:client),URLQueryItem(name:"response_type",value:"code"),URLQueryItem(name:"redirect_uri",value:callback),URLQueryItem(name:"scope",value:"openid"),URLQueryItem(name:"state",value:state),URLQueryItem(name:"code_challenge",value:challenge),URLQueryItem(name:"code_challenge_method",value:"S256")]
            presentationProvider = HQPresentationAnchor(window: NSApp.keyWindow ?? NSApp.windows.first ?? ASPresentationAnchor())
            busy = true
            session = ASWebAuthenticationSession(url: url.url!, callbackURLScheme: "loadiqhq") { [weak self] returned, error in
                Task { @MainActor in
                    guard let self, self.attemptID == attempt else { return }; defer { self.busy = false; self.session = nil }
                    guard error == nil, let returned, returned.scheme == "loadiqhq", returned.host == "auth", let parts = URLComponents(url: returned,resolvingAgainstBaseURL:false) else { self.message = "Sign-in cancelled or unavailable"; return }
                    let items = parts.queryItems ?? []
                    guard items.filter({$0.name == "state"}).count == 1, items.first(where:{$0.name == "state"})?.value == state, let code = items.first(where:{$0.name == "code"})?.value else { self.message = "Sign-in response rejected"; return }
                    do {
                        var request = URLRequest(url: domain.appendingPathComponent("oauth2/token")); request.httpMethod = "POST"
                        request.setValue("application/x-www-form-urlencoded",forHTTPHeaderField:"Content-Type")
                        var form = URLComponents(); form.queryItems = [URLQueryItem(name:"grant_type",value:"authorization_code"),URLQueryItem(name:"client_id",value:self.client),URLQueryItem(name:"redirect_uri",value:self.callback),URLQueryItem(name:"code",value:code),URLQueryItem(name:"code_verifier",value:verifier)]
                        request.httpBody = form.percentEncodedQuery?.replacingOccurrences(of:"+",with:"%2B").data(using:.utf8); request.timeoutInterval = 15
                        let (data,response) = try await URLSession.shared.data(for:request)
                        guard (response as? HTTPURLResponse)?.statusCode == 200, let json = try JSONSerialization.jsonObject(with:data) as? [String:Any], let token = json["access_token"] as? String, let seconds = json["expires_in"] as? Double, seconds > 0 else { throw URLError(.userAuthenticationRequired) }
                        guard self.attemptID == attempt else { return }
                        self.accessToken = token; self.expires = Date().addingTimeInterval(min(seconds,900)-30); self.message = "HQ session established; backend authorization required"
                    } catch { self.message = "HQ sign-in failed; no session saved" }
                }
            }
            session?.presentationContextProvider = presentationProvider; session?.prefersEphemeralWebBrowserSession = true
            if session?.start() != true { busy = false; message = "Unable to open secure sign-in" }
        } catch { message = "Unable to initialize secure sign-in" }
    }
}
