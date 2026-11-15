import SwiftUI

struct ProviderObservation: Decodable, Identifiable {
    let provider, state: String
    let observedAt: String?
    let label: String?
    let latencyMs: Int?
    let items: [ProviderItem]
    var id: String { provider }
}
struct ProviderItem: Decodable, Identifiable {
    let name: String
    let status: String?
    var id: String { name }
}
struct AnalyticsReport: Decodable {
    let emailSending: Bool
    let collectedAt: String
    let providers: [ProviderObservation]
}

struct OperationsView: View {
    let mode: String
    @ObservedObject var session: RemoteSession
    @AppStorage("hq.operatorAPI") private var api = ""
    @State private var report: AnalyticsReport?
    @State private var conversations: [ConversationSummary] = []
    @State private var busy = false
    @State private var error = ""
    private let providers = ["Resend", "AWS", "Vercel", "Sentry", "PostHog", "Redis", "Stripe", "Google Workspace", "Cloudflare"]
    private var settings: [String:String] {
        guard let url = Bundle.main.url(forResource:"OperatorConnection",withExtension:"json"), let data = try? Data(contentsOf:url), let value = try? JSONDecoder().decode([String:String].self,from:data) else { return [:] }
        return value
    }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack {
                    Image(systemName: "person.crop.circle.badge.checkmark").font(.largeTitle).foregroundStyle(.red)
                    VStack(alignment: .leading) {
                        Text("j.karpilo@karpilo-liq.com").font(.headline)
                        Text(session.accessToken == nil ? "HQ operator sign-in required" : "Signed in • operator API access still checked on every request").foregroundStyle(.secondary)
                    }
                    Spacer()
                    Button("Sign in to HQ") {
                        if let value = settings["domain"], let url = URL(string: value) { session.signIn(domain: url) }
                    }.disabled(session.busy)
                    Button("Sign out") { session.signOut(); report = nil; conversations = [] }.disabled(session.accessToken == nil)
                }.padding(18).background(Color.white.opacity(0.04)).clipShape(RoundedRectangle(cornerRadius: 12))
                Text(session.message).font(.caption).foregroundStyle(.secondary)
                DisclosureGroup("Operator service connection") {
                    VStack(alignment: .leading, spacing: 10) {
                        TextField("HTTPS operator API address", text: $api).textFieldStyle(.roundedBorder)
                        Text("Provider credentials stay on the operator server. Chat integrations are not automatically shared with this app.").font(.caption).foregroundStyle(.secondary)
                    }.padding(.top, 10)
                }
                if api.isEmpty && settings["api"] == nil {
                    Label("Operator service has not been deployed or configured. Live data cannot load yet.", systemImage: "exclamationmark.triangle.fill").foregroundStyle(.orange)
                }
                HStack {
                    Button(mode == "Customer communications" ? "Refresh conversations" : "Refresh live status") { load() }
                        .disabled(session.accessToken == nil || busy)
                    if busy { ProgressView().controlSize(.small) }
                    if let report { Text("Observed: " + report.collectedAt).font(.caption).foregroundStyle(.secondary) }
                }
                if !error.isEmpty { Text(error).foregroundStyle(.orange) }
                if mode == "Customer communications" {
                    if conversations.isEmpty {
                        VStack(spacing: 10) {
                            Image(systemName: "bubble.left.and.bubble.right").font(.system(size: 36)).foregroundStyle(.red)
                            Text("No conversations loaded").font(.title2.bold())
                            Text("Sign in and connect the operator service to retrieve subscriber support requests.").foregroundStyle(.secondary)
                        }.frame(maxWidth: .infinity).padding(40)
                    }
                    ForEach(conversations) { conversation in
                        VStack(alignment: .leading, spacing: 6) {
                            Text(conversation.subject).font(.headline)
                            Text(conversation.status).foregroundStyle(.secondary)
                        }.frame(maxWidth: .infinity, alignment: .leading).padding().background(Color.white.opacity(0.04)).cornerRadius(10)
                    }
                } else {
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 260), alignment: .top)], spacing: 14) {
                        ForEach(providers, id: \.self) { name in
                            providerCard(name, report?.providers.first { $0.provider == name })
                        }
                    }
                }
                Label("Email transport disabled • no sending or publishing controls", systemImage: "lock.shield.fill").font(.caption).foregroundStyle(.red)
            }
        }.onDisappear { report = nil; conversations = [] }
    }
    private func providerCard(_ name: String, _ value: ProviderObservation?) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(name).font(.title3.bold()); Spacer()
                Circle().fill(value?.state == "observed" ? Color.green : Color.orange).frame(width: 7, height: 7)
            }
            Text(value?.state.replacingOccurrences(of: "_", with: " ").capitalized ?? "Not connected")
                .font(.system(size: 11, weight: .bold, design: .monospaced)).foregroundStyle(.secondary)
            if let value {
                if let label = value.label { Text(label).font(.caption) }
                ForEach(value.items.prefix(6)) { item in
                    HStack { Text(item.name).lineLimit(1); Spacer(); Text(item.status ?? "Observed").foregroundStyle(.secondary) }.font(.caption)
                }
                if value.items.isEmpty { Text(value.state == "observed" ? "No results returned" : "No measurements available").font(.caption).foregroundStyle(.secondary) }
            } else { Text("Awaiting an authenticated provider response").font(.caption).foregroundStyle(.secondary) }
        }.frame(maxWidth: .infinity, minHeight: 125, alignment: .topLeading).padding(18)
            .background(Color.white.opacity(0.04)).overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.1))).cornerRadius(12)
    }
    private func load() {
        let configured = api.isEmpty ? settings["api"] ?? "" : api
        guard let base = URL(string: configured), base.scheme == "https", base.host != nil, base.user == nil, base.password == nil, base.query == nil, base.fragment == nil else {
            error = "A valid HTTPS operator API address is required."; return
        }
        busy = true; error = ""
        let path = mode == "Customer communications" ? "v1/conversations" : "v1/analytics"
        Task { @MainActor in
            defer { busy = false }
            do {
                var request = URLRequest(url: base.appendingPathComponent(path))
                request.setValue("Bearer " + (try session.token()), forHTTPHeaderField: "Authorization"); request.timeoutInterval = 15
                let client = URLSession(configuration: .ephemeral, delegate: NoRedirect(), delegateQueue: nil)
                defer { client.invalidateAndCancel() }
                let (data, response) = try await client.data(for: request)
                guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
                guard http.statusCode == 200 else {
                    error = http.statusCode == 401 || http.statusCode == 403 ? "The operator service rejected this session. Sign in again or check operator enrollment." : "The operator service is unavailable (HTTP \(http.statusCode))."
                    report = nil; conversations = []; return
                }
                if path == "v1/analytics" {
                    let result = try JSONDecoder().decode(AnalyticsReport.self, from: data)
                    guard !result.emailSending else { error = "Service reports email sending enabled. Connection rejected."; report = nil; return }
                    report = result
                } else {
                    conversations = try JSONDecoder().decode(ConversationPage.self, from: data).requests
                }
            } catch { self.error = "Unable to retrieve verified data: \(error.localizedDescription)"; report = nil; conversations = [] }
        }
    }
}
struct ConversationSummary: Decodable, Identifiable {
    let id, subject, status: String
}
struct ConversationPage: Decodable { let requests: [ConversationSummary] }
final class NoRedirect: NSObject, URLSessionTaskDelegate {
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) { completionHandler(nil) }
}
