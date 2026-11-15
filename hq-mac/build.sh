#!/bin/sh
set -eu
cd "$(dirname "$0")"
# Existing private resource bundle must be present; never commit its template snapshots.
app='build/Karpilo LoadIQ HQ.app'
test -d "$app/Contents/Resources"
swiftc -module-cache-path /tmp/loadiq-hq-swift-cache -target "$(uname -m)-apple-macosx13.0" -warnings-as-errors -parse-as-library HQ.swift Templates.swift Workspace.swift OperatorLock.swift RemoteSession.swift Operations.swift SharedWebHQ.swift -o "$app/Contents/MacOS/LoadIQHQ"
plutil -replace CFBundleName -string 'Karpilo LoadIQ HQ' "$app/Contents/Info.plist"
plutil -replace CFBundleDisplayName -string 'Karpilo LoadIQ HQ' "$app/Contents/Info.plist"
codesign --force --deep --sign - "$app"
