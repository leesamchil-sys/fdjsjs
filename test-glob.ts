const images = import.meta.glob('../../public/images/**/*.{png,jpg,jpeg,svg,webp,PNG,JPG,JPEG,SVG,WEBP}');
console.log(Object.keys(images));
