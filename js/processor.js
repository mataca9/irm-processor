new Vue({
  el: "#app",
  data: {
    imagedata: null,
    canvas: null,
    histogram: null
  },

  mounted: function() {
    this.draw('assets/images/fatia01.bmp');
  },

  methods: {
    draw(file) {
      var img = new Image();
      img.src = file;
      img.crossOrigin = "Anonymous";
      this.canvas = this.$refs['image'];

      img.addEventListener("load", () => {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.canvas
          .getContext("2d")
          .drawImage(
            img,
            0,
            0,
            img.width,
            img.height,
            0,
            0,
            this.canvas.width,
            this.canvas.height
          );
        this.imagedata = this.getImageData(img);
      });
    },

    getImageData(image) {
      const ctx = this.canvas.getContext("2d");
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

    getIntensity(r,g,b){
      return parseInt(0.2126*r + 0.7152*g + 0.0722*b);
    },

    setColor(d, i, r, g, b){
      d[i]    = r;
      d[i+1]  = g;
      d[i+2]  = b;
    },

    setPixelColor(pixel, r, g, b){
      pixel.r = r;
      pixel.g = g;
      pixel.b = b;
    },

    drawHistogram() {
      const d = this.imagedata.data;
      const values = [];

      // Gera lista de intensidades
      for (let i = 0; i < d.length; i += 4) {
        let r = d[i];
        let g = d[i+1];
        let b = d[i+2];
        const intensity = this.getIntensity(r,g,b);
        if(intensity > 0){
          values[intensity] = values[intensity] ? values[intensity] + 1 : 1;
        }
      }

      // Controi histograma
      this.histogram = this.$refs['histogram_canvas'];
      this.histogram.width = 512;
      this.histogram.height = 256;
      const ctx = this.histogram.getContext("2d");
      const histogram_imagedata = ctx.createImageData(this.histogram.width, this.histogram.height);

      const max = values.reduce((a, b) => { return Math.max(a,b)});
      const data = histogram_imagedata.data;
      for(let x = 0; x < this.histogram.width; x++){
        for(let y = 0; y < this.histogram.height; y++){
          let color = 255;

          let value = (values[x] * this.histogram.height / max);

          if (value < y){
            color = 0;
          } 
                
          let position =  (x + 512 * y) * 4;
          data[position]      = color;
          data[position + 1]  = color;
          data[position + 2]  = color;
          data[position + 3]  = 255;
        }
      }
      histogram_imagedata.data = data;
      

      /*
      for (var i=0;i<histogram_imagedata.data.length;i+=4)
      {
        let x =  i % 512;
        let y =  parseInt(i / 512);
        
        let color = 255;
        if (values[x] >= y){
          color = 0;
        }  

        histogram_imagedata.data[i+0]=color;
        histogram_imagedata.data[i+1]=color;
        histogram_imagedata.data[i+2]=color;
        histogram_imagedata.data[i+3]=255;
      }*/
      ctx.putImageData(histogram_imagedata, 0, 0);
    },

    getMaxIntensity(){
      const d = this.imagedata.data;
      const values = [];
      let max = 0;
      for (let i=0; i<d.length; i+=4) {
        let r = d[i];
        let g = d[i+1];
        let b = d[i+2];
        const intensity = this.getIntensity(r,g,b);

        max = Math.max(max, intensity);
      }

      return max;
    },

    adjustBrightness() {
      const d = this.imagedata.data;
      const values = [];
      let max = this.getMaxIntensity();
      console.log(max);
      for (let i=0; i<d.length; i+=4) {
        let r = d[i];
        let g = d[i+1];
        let b = d[i+2];
        const intensity = this.getIntensity(r,g,b);
        const adjusted = intensity * 255 / max;
        if(intensity > 0){
          this.setColor(d, i, adjusted, adjusted, adjusted);
        }
      }

      const ctx = this.canvas.getContext("2d");
      ctx.putImageData(this.imagedata, 0, 0);
    },

    threshold() {
      const WHITE   = 1;
      const GRAY    = 76;
      const LIQUID  = 96;

      const d = this.imagedata.data;
      for (let i=0; i<d.length; i+=4) {
        let r = d[i];
        let g = d[i+1];
        let b = d[i+2];
        const intensity = this.getIntensity(r,g,b);

        if(intensity > WHITE && intensity < GRAY) {
          this.setColor(d, i, 255, 0, 0);
        } else if (intensity > GRAY && intensity < LIQUID) {
          this.setColor(d, i, 0, 255, 0);
        } else if (intensity > LIQUID && intensity < 255) {
          this.setColor(d, i, 0, 0, 255);
        }
      }
      
      const ctx = this.canvas.getContext("2d");
      ctx.putImageData(this.imagedata, 0, 0);
    }
  }

});
