import SwiftUI
import UniformTypeIdentifiers
import WebKit

struct HQWorkspace: View {
    @StateObject private var remoteSession = RemoteSession()
    @State private var section = "Templates"
    @State private var search = ""
    @State private var selected: String? = Template.catalog.first?.alias
    @State private var catalog = Template.catalog
    @State private var syncMessage = "Bundled Resend snapshot • not a live connection"
    @State private var syncing = false
    @State private var liveCatalog = false
    @State private var remoteBodies: [String:String] = [:]
    @State private var remoteSubjects: [String:String] = [:]
    let sections = ["Analysis center", "Templates", "Delivery map", "Integrations", "Customer communications"]
    let symbols = ["chart.xyaxis.line", "envelope.open.fill", "arrow.triangle.branch", "network", "bubble.left.and.bubble.right.fill"]
    private let red = Color(red: 0.96, green: 0.12, blue: 0.16)
    private let panel = Color(red: 0.075, green: 0.08, blue: 0.095)
    private var filtered: [Template] {
        catalog.filter { search.isEmpty || ($0.name + " " + $0.subject + " " + $0.alias).localizedCaseInsensitiveContains(search) }
    }
    var body: some View {
        HStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 22) {
                if let url = Bundle.main.url(forResource: "HQBrand", withExtension: "png"), let image = NSImage(contentsOf: url) {
                    Image(nsImage: image).resizable().scaledToFit().frame(width: 160, height: 160).clipShape(RoundedRectangle(cornerRadius: 24))
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text("LOADIQ HQ").font(.system(size: 24, weight: .black, design: .rounded))
                    Text("OPERATOR WORKSPACE").font(.system(size: 10, weight: .bold, design: .monospaced)).tracking(2).foregroundStyle(.secondary)
                }
                Rectangle().fill(red).frame(height: 2)
                ForEach(Array(sections.enumerated()), id: \.element) { index, title in
                    Button { section = title } label: {
                        HStack(spacing: 10) {
                            Image(systemName: symbols[index]).frame(width: 20)
                            Text(title).font(.system(size: 12, weight: .semibold))
                            Spacer(minLength: 0)
                        }.padding(11).foregroundStyle(section == title ? .white : Color.gray)
                            .background(section == title ? red.opacity(0.2) : Color.clear)
                            .overlay(RoundedRectangle(cornerRadius: 9).stroke(section == title ? red : .clear, lineWidth: 1))
                    }.buttonStyle(.plain)
                }
                Spacer()
                Label("DELIVERY LOCKED", systemImage: "lock.shield.fill").font(.system(size: 11, weight: .bold, design: .monospaced)).foregroundStyle(red)
                Text("Email sending is off").font(.caption).foregroundStyle(.secondary)
            }.padding(22).frame(width: 235).background(panel)
            Rectangle().fill(Color.white.opacity(0.1)).frame(width: 1)
            VStack(alignment: .leading, spacing: 18) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 5) {
                        Text(section.uppercased()).font(.system(size: 26, weight: .black, design: .rounded))
                        Text(subtitle).font(.callout).foregroundStyle(.secondary)
                    }
                    Spacer()
                    Label("EMAIL OFF", systemImage: "lock.fill").font(.system(size: 11, weight: .bold, design: .monospaced))
                        .padding(10).background(red.opacity(0.15)).foregroundStyle(red).clipShape(Capsule())
                }
                if let error = Template.loadError { Label(error, systemImage: "exclamationmark.triangle.fill").foregroundStyle(.orange) }
                if section == "Templates" {
                    HStack(spacing: 12) {
                        metric("TEMPLATES", "\(catalog.count)")
                        metric("CURRENT", "\(catalog.filter { !$0.alias.contains("superseded") }.count)")
                        metric("EMAIL DELIVERY", "OFF")
                    }
                    TextField("Search by name, subject, or alias", text: $search).textFieldStyle(.roundedBorder)
                    HStack {
                        Text(syncMessage).font(.caption).foregroundStyle(.secondary)
                        Spacer()
                        Button("Sync from Resend") { syncTemplates() }.disabled(syncing || remoteSession.accessToken == nil)
                    }
                    HSplitView {
                        List(selection: $selected) {
                            ForEach(filtered) { item in
                                VStack(alignment: .leading, spacing: 6) {
                                    Text(item.name).font(.system(size: 12, weight: .semibold)).lineLimit(2)
                                    HStack { Text(item.channel.uppercased()); Spacer(); Text(item.alias.contains("superseded") ? "ARCHIVED" : item.status.uppercased()) }
                                        .font(.system(size: 9, weight: .medium, design: .monospaced)).foregroundStyle(.secondary)
                                }.padding(.vertical, 7).tag(item.alias)
                            }
                        }.scrollContentBackground(.hidden).background(panel).frame(minWidth: 240, idealWidth: 290, maxWidth: 360)
                        if let template = catalog.first(where: { $0.alias == selected }) {
                            TemplateEditor(template: template, remoteBody: remoteBodies[template.alias], remoteSubject: remoteSubjects[template.alias]).id(template.alias + String(remoteBodies[template.alias]?.hashValue ?? 0))
                        } else {
                            VStack(spacing: 12) {
                                Image(systemName: "envelope.open").font(.largeTitle).foregroundStyle(red)
                                Text(filtered.isEmpty ? "No templates match your search" : "Choose a template")
                            }.frame(maxWidth: .infinity, maxHeight: .infinity)
                        }
                    }.background(panel).clipShape(RoundedRectangle(cornerRadius: 12))
                } else if section == "Delivery map" {
                    List(Template.catalog) { item in
                        HStack { Text(item.name); Spacer(); Text(item.channel.uppercased()).foregroundStyle(red); Text(item.status).foregroundStyle(.secondary) }
                    }.scrollContentBackground(.hidden)
                    Text("Channel assignments are recorded policy. Delivery remains disabled.").font(.caption).foregroundStyle(.secondary)
                } else {
                    OperationsView(mode: section, session: remoteSession)
                }
            }.padding(24).frame(maxWidth: .infinity, maxHeight: .infinity).background(Color(red: 0.035, green: 0.04, blue: 0.05))
        }.frame(minWidth: 1120, minHeight: 740).preferredColorScheme(.dark).tint(red)
            .task(id: selected) { await loadRemoteBody() }
    }
    private func syncTemplates() {
        syncing = true
        Task { @MainActor in
            defer { syncing = false }
            do {
                let result = try JSONDecoder().decode(RemoteTemplatePage.self, from: await remoteSession.readGateway("v1/templates"))
                guard !result.has_more else { syncMessage = "Provider catalog exceeds one page; existing library preserved."; return }
                catalog = result.data; liveCatalog = true; remoteBodies = [:]; remoteSubjects = [:]
                if !catalog.contains(where: { $0.alias == selected }) { selected = catalog.first?.alias }
                syncMessage = "Live Resend catalog • " + result.observedAt
                await loadRemoteBody()
            } catch { syncMessage = "Sync unavailable: " + error.localizedDescription }
        }
    }
    private func loadRemoteBody() async {
        guard liveCatalog, let alias = selected, remoteBodies[alias] == nil,
              alias.range(of: "^[a-zA-Z0-9_-]{1,128}$", options: .regularExpression) != nil else { return }
        do {
            let result = try JSONDecoder().decode(RemoteTemplateBody.self, from: await remoteSession.readGateway("v1/templates/" + alias))
            remoteBodies[alias] = result.html
            remoteSubjects[alias] = result.subject
        } catch { syncMessage = "Template body unavailable: " + error.localizedDescription }
    }
    private var subtitle: String {
        switch section {
        case "Templates": return "Resend template library • rendered previews and saved local drafts"
        case "Delivery map": return "Know which messages belong in email, the subscriber inbox, or both"
        case "Integrations": return "Connection status and observed provider data"
        case "Customer communications": return "Subscriber conversations through the authorized operator service"
        default: return "Service health, delivery status, and operator activity"
        }
    }
    private func metric(_ title: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(title).font(.system(size: 10, weight: .medium, design: .monospaced)).foregroundStyle(.secondary)
            Text(value).font(.system(size: 24, weight: .bold, design: .rounded))
        }.frame(maxWidth: .infinity, alignment: .leading).padding(14).background(panel).overlay(alignment: .bottom) { Rectangle().fill(red.opacity(0.65)).frame(height: 2) }
    }
}

struct TemplateEditor: View {
    let template: Template
    var remoteBody: String? = nil
    var remoteSubject: String? = nil
    @State private var subject = ""
    @State private var content = ""
    @State private var status = ""
    @State private var importing = false
    @State private var preview = true
    private var originalBody: String {
        if let remoteBody { return remoteBody }
        guard let url = Bundle.main.url(forResource: template.alias, withExtension: "html") else { return "" }
        return (try? String(contentsOf: url, encoding: .utf8)) ?? ""
    }
    private var key: String { "template-draft." + template.alias }
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(template.name).font(.title2)
            Text("Delivery: \(Template.catalog.first(where: { $0.alias == template.alias })?.channel ?? template.channel) · Provider status recorded: \(template.status)").foregroundStyle(.secondary)
            Text("Variables: " + template.variables.joined(separator: ", ")).font(.caption)
            TextField("Subject", text: $subject)
            HStack {
                Button("Import HTML body") { importing = true }
                Button("Save local draft") { save() }.keyboardShortcut("s", modifiers: .command)
                Toggle("Rendered preview", isOn: $preview)
            }
            if content.isEmpty { Text("Original template body is not downloaded. Import the original HTML to edit it locally; no replacement content has been invented.").foregroundStyle(.orange) }
            if preview { SafePreview(html: content) }
            else { TextEditor(text: $content).font(.system(.body, design: .monospaced)).accessibilityLabel("Template HTML draft") }
            Text(status).font(.caption)
            Text("Local drafts only. No publish or send action is available.").font(.caption).foregroundStyle(.secondary)
        }.padding().onAppear {
            let saved = UserDefaults.standard.dictionary(forKey: key)
            subject = saved?["subject"] as? String ?? remoteSubject ?? template.subject
            content = saved?["body"] as? String ?? originalBody
            status = saved == nil ? "No local draft saved" : "Restored local draft"
        }.onChange(of: subject) { _ in save() }.onChange(of: content) { _ in save() }
        .fileImporter(isPresented: $importing, allowedContentTypes: [.html, .plainText]) { result in
            do {
                let url = try result.get(); let access = url.startAccessingSecurityScopedResource()
                defer { if access { url.stopAccessingSecurityScopedResource() } }
                let data = try Data(contentsOf: url)
                guard data.count <= 2_000_000, let text = String(data: data, encoding: .utf8) else { status = "Import requires UTF-8 text under 2 MB"; return }
                content = text; save()
            } catch { status = "Import failed; existing draft preserved" }
        }
    }
    private func save() {
        UserDefaults.standard.set(["subject": subject, "body": content], forKey: key)
        status = "Saved on this Mac · " + Date().formatted(date: .omitted, time: .shortened)
    }
}

struct RemoteTemplatePage: Decodable { let data: [Template]; let has_more: Bool; let observedAt: String }
struct RemoteTemplateBody: Decodable { let html, subject: String }

struct SafePreview: NSViewRepresentable {
    let html: String
    func makeCoordinator() -> Coordinator { Coordinator() }
    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .nonPersistent()
        config.defaultWebpagePreferences.allowsContentJavaScript = false
        let view = WKWebView(frame: .zero, configuration: config)
        view.navigationDelegate = context.coordinator
        return view
    }
    func updateNSView(_ view: WKWebView, context: Context) {
        guard context.coordinator.previous != html else { return }
        context.coordinator.previous = html
        view.loadHTMLString("<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'none'; base-uri 'none'\">" + html, baseURL: nil)
    }
    final class Coordinator: NSObject, WKNavigationDelegate {
        var previous: String?
        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            decisionHandler(action.navigationType == .other && action.request.url?.absoluteString == "about:blank" ? .allow : .cancel)
        }
    }
}
