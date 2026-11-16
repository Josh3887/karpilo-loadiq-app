import Foundation

struct Template: Decodable, Identifiable {
    let alias, name, subject, channel, status: String
    let variables: [String]
    var id: String { alias }
    enum CodingKeys: String, CodingKey { case alias, name, subject, channel, status, variables }
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        alias = try c.decode(String.self, forKey: .alias)
        name = try c.decode(String.self, forKey: .name)
        subject = try c.decodeIfPresent(String.self, forKey: .subject) ?? ""
        channel = try c.decode(String.self, forKey: .channel)
        status = try c.decode(String.self, forKey: .status)
        variables = try c.decodeIfPresent([String].self, forKey: .variables) ?? []
    }
    static let loaded: Result<[Template], Error> = Result {
        guard let url = Bundle.main.url(forResource: "Templates", withExtension: "json") else {
            throw NSError(domain: "HQCatalog", code: 1, userInfo: [NSLocalizedDescriptionKey: "The installed app is missing Templates.json."])
        }
        return try JSONDecoder().decode([Template].self, from: Data(contentsOf: url))
    }
    static var catalog: [Template] { (try? loaded.get()) ?? [] }
    static var loadError: String? {
        if case .failure(let error) = loaded { return "Template catalog failed to load: \(error.localizedDescription)" }
        return nil
    }
}
