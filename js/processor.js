new Vue({
  el: "#app",
  data: {
    imagedata: null,
    image: null,
    image2: null,
    histogram: null
  },

  mounted: function () {
    //this.draw('assets/moonlanding.png');
    this.draw('assets/images/fatia01.bmp', 'image');
    this.draw('assets/images/gt_fatia01.bmp', 'image2');
  },

  methods: {
    draw(file, target) {
      var img = new Image();
      img.src = file;
      img.crossOrigin = "Anonymous";
      
      this[target] = this.$refs[target];

      img.addEventListener("load", () => {
        this[target].width = img.width;
        this[target].height = img.height;
        this[target]
          .getContext("2d")
          .drawImage(
            img,
            0,
            0,
            img.width,
            img.height,
            0,
            0,
            this[target].width,
            this[target].height
          );
      });
    },

    getImageData(image) {
      const ctx = this.image.getContext("2d");
      ctx.drawImage(image, 0, 0);

      return ctx.getImageData(0, 0, image.width, image.height);
    },

    getPixel(image, x, y) {
      const position = (x + image.width * y) * 4;
      const d = image.data;
      const pixel = {
        r: d[position],
        g: d[position + 1],
        b: d[position + 2],
        a: d[position + 3]
      };

      return pixel;
    },

    writePixel(image, x, y, r, g, b, a = 255) {
      const position = (x + image.width * y) * 4;
      const d = image.data;
      [d[position],
      d[position + 1],
      d[position + 2],
      d[position + 3]] = [r, g, b, a];
    },

    getIntensity(r, g, b) {
      return parseInt(0.2126 * r + 0.7152 * g + 0.0722 * b);
    },

    setColor(d, i, r, g, b) {
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
    },

    drawHistogram(canvas) {
      const ctx = canvas.getContext("2d");
      const imagedata = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imagedata.data;
      const values = [];

      // Gera lista de intensidades
      for (let i = 0; i < d.length; i += 4) {
        let r = d[i];
        let g = d[i + 1];
        let b = d[i + 2];
        const intensity = this.getIntensity(r, g, b);
        if (intensity > 0) {
          values[intensity] = values[intensity] ? values[intensity] + 1 : 1;
        }
      }

      // Constroi histograma
      this.histogram = this.$refs['histogram_canvas'];
      this.histogram.width = 512;
      this.histogram.height = 256;
      const hctx = this.histogram.getContext("2d");
      const histogram_imagedata = ctx.createImageData(this.histogram.width, this.histogram.height);

      const max = values.reduce((a, b) => { return Math.max(a, b) });
      const data = histogram_imagedata.data;
      for (let x = 0; x < this.histogram.width; x++) {
        for (let y = 0; y < this.histogram.height; y++) {
          let color = 255;

          let value = (values[x] * this.histogram.height / max);

          if (this.histogram.height - value < y) {
            color = 0;
          }

          let position = (x + this.histogram.width * y) * 4;
          data[position] = color;
          data[position + 1] = color;
          data[position + 2] = color;
          data[position + 3] = 255;
        }
      }
      histogram_imagedata.data = data;
      hctx.putImageData(histogram_imagedata, 0, 0);
    },

    getMaxIntensity(imagedata) {
      const d = imagedata.data;
      const values = [];
      let max = 0;
      for (let i = 0; i < d.length; i += 4) {
        const [r, g, b] = d.slice(i, i + 3);
        const intensity = this.getIntensity(r, g, b);

        max = Math.max(max, intensity);
      }

      return max;
    },

    adjustBrightness(canvas) {
      const ctx = canvas.getContext("2d");
      const imagedata = ctx.getImageData(0, 0, canvas.width, canvas.height);

      let max = this.getMaxIntensity(imagedata);
      for (let x = 0; x < imagedata.width; x++) {
        for (let y = 0; y < imagedata.height; y++) {
          const pixel = this.getPixel(imagedata, x, y);
          const intensity = this.getIntensity(pixel.r, pixel.g, pixel.b);
          const adjusted = intensity * 255 / max;
          if (intensity > 0) {
            this.writePixel(imagedata, x, y, adjusted, adjusted, adjusted);
          }
        }
      }

      ctx.putImageData(imagedata, 0, 0);
    },

    median(canvas, w) {
      const ctx = canvas.getContext("2d");
      const imagedata = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const hw = parseInt(w / 2);

      for (let x = 0; x < imagedata.width; x++) {
        for (let y = 0; y < imagedata.height; y++) {
          const w_list = [];
          for (let xx = x - hw; xx <= x + hw; xx++) {
            for (let yy = y - hw; yy <= y + hw; yy++) {
              const pixel = this.getPixel(imagedata, xx, yy);
              const intensity = this.getIntensity(pixel.r, pixel.g, pixel.b);
              w_list.push(intensity);
            }
          }
          const value = w_list.sort((a, b) => a - b)[parseInt(w * w / 2)];
          this.writePixel(result, x, y, value, value, value, 255);
        }
      }

      ctx.putImageData(result, 0, 0);
    },

    calculateThreshold(canvas) {
      if (!canvas) {
        return [0, 0, 0];
      }

      const ctx = canvas.getContext("2d");
      const imagedata = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const values = [...new Array(256)].map(v => 0);

      for (let x = 0; x < imagedata.width; x++) {
        for (let y = 0; y < imagedata.height; y++) {
          const pixel = this.getPixel(imagedata, x, y);
          const intensity = this.getIntensity(pixel.r, pixel.g, pixel.b);

          if (intensity === 0) {
            values[x]++;
          }
        }
      }

      const avg = values.reduce((a, b) => (a + b)) / values.filter(v => v > 0).length;
      const avgH = values.reduce((a, b) => (b > avg ? a + b : a)) / values.filter(v => v > avg).length;
      const avgL = values.reduce((a, b) => (b < avg ? a + b : a)) / values.filter(v => v < avg).length;

      return [avgL, avg, avgH];
    },

    threshold(canvas) {
      const ctx = canvas.getContext("2d");
      const imagedata = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const [WHITE, GRAY, LIQUID] = this.calculateThreshold(this.histogram);

      for (let x = 0; x < imagedata.width; x++) {
        for (let y = 0; y < imagedata.height; y++) {
          const pixel = this.getPixel(imagedata, x, y);
          const intensity = this.getIntensity(pixel.r, pixel.g, pixel.b);

          if (intensity > WHITE && intensity < GRAY) {
            this.writePixel(imagedata, x, y, 0, 0, 255);
          } else if (intensity > GRAY && intensity < LIQUID) {
            this.writePixel(imagedata, x, y, 255, 0, 0);
          } else if (intensity > LIQUID && intensity < 255) {
            this.writePixel(imagedata, x, y, 0, 255, 0);
          }
        }
      }

      ctx.putImageData(imagedata, 0, 0);
    },

    erosion(canvas, element) {
      const ctx = canvas.getContext("2d");
      const imagedata = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = ctx.getImageData(0, 0, canvas.width, canvas.height);

      for (let x = 0; x < imagedata.width; x++) {
        for (let y = 0; y < imagedata.height; y++) {

          let pixel = this.getPixel(imagedata, x, y);
          let intensity = this.getIntensity(pixel.r, pixel.g, pixel.b);

          if (intensity == 0) continue;

          const data = element.data;
          const xsize = data.length;
          let min = 999;
          for (let xx = x - element.x, ex = 0; ex < xsize; xx++ , ex++) {
            const ysize = data[ex].length;
            for (let yy = y - element.y, ey = 0; ey < ysize; yy++ , ey++) {
              if (data[ex][ey]) {
                pixel = this.getPixel(imagedata, xx, yy);
                intensity = this.getIntensity(pixel.r, pixel.g, pixel.b);
                min = Math.min(min, intensity - data[ex][ey]);
              }
            }
          }
          this.writePixel(result, x, y, min, min, min);
        }
      }

      ctx.putImageData(result, 0, 0);
    },

    dilation(canvas, element) {
      const ctx = canvas.getContext("2d");
      const imagedata = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = ctx.getImageData(0, 0, canvas.width, canvas.height);

      for (let x = 0; x < imagedata.width; x++) {
        for (let y = 0; y < imagedata.height; y++) {

          let pixel = this.getPixel(imagedata, x, y);
          let intensity = this.getIntensity(pixel.r, pixel.g, pixel.b);

          if (intensity == 0) continue;

          const data = element.data;
          const xsize = data.length;
          let max = 0;
          for (let xx = x - element.x, ex = 0; ex < xsize; xx++ , ex++) {
            const ysize = data[ex].length;
            for (let yy = y - element.y, ey = 0; ey < ysize; yy++ , ey++) {
              if (data[ex][ey]) {
                pixel = this.getPixel(imagedata, xx, yy);
                intensity = this.getIntensity(pixel.r, pixel.g, pixel.b);
                max = Math.max(max, intensity + data[ex][ey]);
              }
            }
          }
          this.writePixel(result, x, y, max, max, max);
        }
      }

      ctx.putImageData(result, 0, 0);
    }

  }

});
