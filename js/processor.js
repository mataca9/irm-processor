new Vue({
  el: "#app",
  data: {
    imagedata: null
  },

  mounted: function() {
    this.draw('assets/images/fatia01.bmp');
  },

  methods: {
    draw(file) {
      var img = new Image();
      img.src = file;
      img.crossOrigin = "Anonymous";
      const canvas = this.$refs['canvas'];

      img.addEventListener("load", () => {
        canvas.width = img.width;
        canvas.height = img.height;
        canvas
          .getContext("2d")
          .drawImage(
            img,
            0,
            0,
            img.width,
            img.height,
            0,
            0,
            canvas.width,
            canvas.height
          );
        this.imagedata = this.getImageData(img);
      });
    },

    getImageData(image) {
      var canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;

      var context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);

      return context.getImageData(0, 0, image.width, image.height);
    },

    getPixel(x, y) {
      const position = (x + this.imagedata.width * y) * 4;
      const data = this.imagedata.data;
      const pixel = {
        r: data[position],
        g: data[position + 1],
        b: data[position + 2],
        a: data[position + 3]
      };

      console.log(pixel);

      return pixel;
    }

  }
});
