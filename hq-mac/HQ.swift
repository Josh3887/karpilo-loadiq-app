import SwiftUI

@main
struct LoadIQHQ: App {
    var body: some Scene {
        WindowGroup("LoadIQ HQ") { OperatorLock() }
    }
}

struct DraftWorkspace: View {
    @State private var selection = ""
    private var selectedTemplate: Template? {
        Template.catalog.first { $0.id == selection }
    }

    @AppStorage("draft.subject") private var subject = ""
    @AppStorage("draft.body") private var bodyText = ""
    @AppStorage("draft.channel") private var channel = "In-app inbox"

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("LoadIQ HQ").font(.largeTitle)
            Label("Local drafts · Email sending off", systemImage: "lock.shield")
            Picker("Template", selection: $selection) {
                Text("Choose a template").tag("")
                ForEach(Template.catalog) { template in
                    Text(template.name).tag(template.id)
                }
            }
            if let template = selectedTemplate {
                Text(template.subject).font(.headline)
                Text("Channel: \(template.channel) · Status: \(template.status)")
                Text("Variables: \(template.variables.joined(separator: ", "))")
                Button("Use subject in draft") { subject = template.subject }
            } else if Template.catalog.isEmpty {
                Text("Template catalog unavailable.")
            }
            TextField("Subject", text: $subject)
            Picker("Intended delivery", selection: $channel) {
                ForEach(["In-app inbox", "Email", "Both"], id: \.self) { Text($0) }
            }
            HSplitView {
                VStack(alignment: .leading) {
                    Text("Draft").font(.headline)
                    TextEditor(text: $bodyText).accessibilityLabel("Draft body")
                }
                VStack(alignment: .leading) {
                    Text("Preview").font(.headline)
                    ScrollView {
                        VStack(alignment: .leading, spacing: 12) {
                            Text(subject.isEmpty ? "Untitled draft" : subject).font(.title2)
                            Text(bodyText.isEmpty ? "Start typing to preview your draft." : bodyText)
                        }.frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
            }
            Text("Saved on this Mac. Delivery selection is for planning.")
                .foregroundStyle(.secondary)
        }
        .padding(24)
        .frame(minWidth: 700, minHeight: 450)
    }
}
