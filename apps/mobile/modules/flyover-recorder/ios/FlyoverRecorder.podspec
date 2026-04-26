require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'FlyoverRecorder'
  s.version        = package['version']
  s.summary        = 'ReplayKit-based screen recorder for cinematic flyover replays.'
  s.description    = 'Records the in-app flyover phase as an MP4 using RPScreenRecorder.'
  s.license        = 'MIT'
  s.author         = 'FitAI'
  s.homepage       = 'https://fitai.app'
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.{h,m,swift}'
end
