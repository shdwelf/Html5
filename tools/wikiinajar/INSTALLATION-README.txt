Wiki-in-a-Jar 0.8 — image and DjVu support

Run the included bin/start.sh (or `java -jar wiki.in.a.jar 3003`), then open
http://localhost:3003/wiki. The new Image Support Demo article is linked from
Main Page.

Put local raster images and DjVu files beneath public/docs/image. Supported
raster suffixes are .png, .jpg, .jpeg, .gif, .webp, .bmp, and .avif. The server
also serves .djvu and .djv files for the browser reader. Paths may use relative
subdirectories, but may not escape the image directory.

Wikitext examples:

  [[image:diagram.png|Diagram alt text]]
  [[img:maps/toronto.webp|Map of Toronto]]
  [[djvu:reference.djvu|Read the reference]]

A DjVu preview is rendered in-browser with a locally bundled WebAssembly
decoder. The document is downloaded in full when its viewer approaches the
viewport; use smaller files for older machines. The download link remains
available if JavaScript or WebAssembly is disabled.

The original application has no authentication. Keep it on a trusted local
network; do not expose it directly to the public Internet.
