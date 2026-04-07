#!/bin/bash

components=(
  "https://21st.dev/r/kedhareswer.12110626/layout-preloader"
  "https://21st.dev/r/nyxbui/warp-background"
  "https://21st.dev/r/ravikatiyar162/loader-4"
  "https://21st.dev/r/ravikatiyar162/animated-shader-hero"
  "https://21st.dev/r/designali-in/particle-canvas-1"
  "https://21st.dev/r/designali-in/animated-dots"
  "https://21st.dev/r/kokonutd/background-paths"
  "https://21st.dev/r/ruixen.ui/notifications-with-actions"
  "https://21st.dev/r/moazamtrade/the-future-arrives-soon-cta"
  "https://21st.dev/r/victorwelander/upgrade-banner"
  "https://21st.dev/r/lovesickfromthe6ix/iphone-mockup"
  "https://21st.dev/r/rahil1202/scanner-card-stream"
  "https://21st.dev/r/ibelick/progressive-blur"
  "https://21st.dev/r/easemize/multi-type-ripple-buttons"
  "https://21st.dev/r/kokonutd/action-search-bar"
  "https://21st.dev/r/ozantekin/get-started-button"
  "https://21st.dev/r/sshahaider/text-disperse"
  "https://21st.dev/r/easemize/spotlight-card"
  "https://21st.dev/r/aceternity/container-scroll-animation"
  "https://21st.dev/r/danielpetho/image-trail"
  "https://21st.dev/r/prashantsom75/scroll-morph-hero"
  "https://21st.dev/r/aceternity/hero-parallax"
  "https://21st.dev/r/hari/reveal-images"
  "https://21st.dev/r/shuding/cobe-globe-pulse"
  "https://21st.dev/r/abdulali254/nav-header"
  "https://21st.dev/r/vaib215/stagger-testimonials"
  "https://21st.dev/r/kavikatiyar/testimonial-slider-1"
  "https://21st.dev/r/serafimcloud/balloons"
  "https://21st.dev/r/gonzalochale/commits-grid"
  "https://21st.dev/r/minhxthanh/404-page-not-found"
  "https://21st.dev/r/aghasisahakyan1/loader"
)

for component in "${components[@]}"
do
  echo "Installing: $component"
  echo "y" | npx shadcn@latest add "$component" --yes 2>&1 | tail -5
  echo "---"
done
