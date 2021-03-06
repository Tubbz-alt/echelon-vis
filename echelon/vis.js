// vis.js
svgns = "http://www.w3.org/2000/svg";

namedColor = function (colorname) {
  if (colorname == "na") {
    colorname = get_default("color");
  }
  let colorhues = {
    "red": 0,
    "orange": 30, // Humans sensitive to orange
    "yellow": 60,
    "green": 120,
    "cyan": 180,
    "blue": 240,
    "magenta": 300
  };
  var hue;
  var sat;
  if (colorname == "grey") {
    hue = 0;
    sat = 0;
  } else {
    hue = colorhues[colorname];
    sat = 100;
  }
  return { "hue": hue, "sat": sat };
};
namedBrightness = function (bname) {
  if (bname == "na") {
    bname = get_default("brightness");
  }
  // e.g. "b1" ... "b7"
  //let lev = +bname.substr(1); // extract number
  let lev = +bname;
  // 1 => 0%, 7 => 100%
  let val = (lev - 1) * 100 / 6;
  //val = (lev - 1) * 80 / 6 + 20; // Temporary work-around to avoid black colors
  return val;
};
namedTexture = function (tname) {
  if (tname == "na") {
    tname = get_default("texture");
  }
  // e.g. "t1" ... "t5"
  //let tnum = +tname.substr(1); // extract number
  let tnum = +tname;
  return "url(#linebg" + tnum + ")";
};
namedOrient = function (oname) {
  if (oname == "na") {
    oname = get_default("orientation");
  }
  // e.g. deg0;deg30;deg90;deg60
  let onum = +oname.substr(3); // extract number
  //let onum = +oname
  //return "rotate(" + onum + ")"
  return onum;
};
namedSize = function (sname) {
  if (sname == "na") {
    sname = get_default("size");
  }
  // s1;s2;s3;s4;s5;s6;s7;s8;s9;s10;s11;s12;s13;s14;s15;s16;s17;s18;s19;s20
  //let snum = +sname.substr(1); // extract number
  let snum = +sname;
  return snum * 5;
};
render = function (posx, posy, size, value, texture, color, orient, shape) {
  let huesat = namedColor(color);
  let hue = huesat.hue;
  let sat = huesat.sat;
  let lightness = namedBrightness(value);
  // TODO: Correct for different perceptual brightness
  let colorCombo = "hsl(" + hue + ", " + sat + "%, " + lightness + "%)";
  let pat = namedTexture(texture);
  // TODO: Allow changing orientation of texture without altering orientation
  // of shape. (Okay for now, but will be needed for area implementation)
  let rot = namedOrient(orient);
  let dim = namedSize(size);
  var node;
  if (shape === "circle") {
    node = document.createElementNS(svgns, "circle")
    node.setAttribute("r", dim/2);
    node.setAttribute("cx", dim/2);
    node.setAttribute("cy", dim/2);
  } else if (shape === "rect") { // if (shape == "rect") { // TODO: Other shapes
    node = document.createElementNS(svgns, "rect");
    node.setAttribute("width", dim);
    node.setAttribute("height", dim);
    node = node
  } else {
    node = document.createElementNS(svgns, "g");
    poly = document.createElementNS(svgns, "polygon");
    if (shape === "triangle") {
      poly.setAttribute("points", "0 -8 -8 6.92 8 6.92");
    } else if (shape === "hexagon") {
      poly.setAttribute("points", "-4 -8 4 -8 8 0 4 8 -4 8 -8 0");
    } else if (shape === "na") {
      // line
      poly.setAttribute("points", "-8 -1 -8 1 8 1 8 -1");
    }
    node.appendChild(poly);
    poly.setAttribute("transform", "scale(" + dim/16 + ") translate(8,8)")
  }
  node.setAttribute("fill", colorCombo);
  //node.setAttribute("fill", pat); // TODO: Figure out how to combine pattern and color combo!!! Use pat as mask? Dynamically generate pat?
  // https://vanseodesign.com/web-design/svg-masking-examples-1/
  //node.setAttribute("mask", pat); // Use pat as mask
  let g = document.createElementNS(svgns, "g");
  g.setAttribute("mask", pat)
  g.appendChild(node);
  g.setAttribute("transform", "translate(" + posx + ", " + posy + ") rotate(" + rot + ", " + dim/2 + ", " + dim/2 + ")");
  // g.setAttribute("stroke", "black");
  return g;
};
lerp = function(inVal, inMin, inMax, outMin, outMax) {
  outRange = outMax - outMin;
  inRange = inMax - inMin;
  return outMin + (inVal - inMin) * outRange / inRange
}
encode_x = function(propval, dom) {
  return lerp(propval, dom["min"], dom["max"], 0, 800);
};
encode_y = function(propval, dom) {
  return lerp(propval, dom["min"], dom["max"], 0, 600);
};
encode_size = function(propval) {
  return Math.round(5 + (propval - 20190930) / 20)
};
encode_color = function(propval) { 
  // TODO: Extract domain from schema
  let ramp = {
    "undersat": "green",
    "oversat": "red"
  };
  return ramp[propval];
};
encode_brightness = function(propval) {
  return Math.round(0.5 + propval / 20);
}
encode_texture = function(propval) {
  // TODO: Extract domain from schema
  let ramp = {
    "undersat": "1",
    "oversat": "2"
  };
  return ramp[propval];
};
encode_orientation = function(propval) {
  // TODO: Extract domain from schema
  let ramp = {
    "1": "rot0",
    "2": "rot30",
    "3": "rot60",
    "4": "rot90"
  };
  // assign to buckets based on first letter
  let bucket = propval.charCodeAt(0) % 4 + 1
  return ramp[bucket];
};

get_default = function(key) {
  let defaults = {
    "posx": 10,
    "posy": 10,
    "size": "8",
    "color": "grey",
    "brightness": "4",
    "texture": "1",
    "orientation": "rot30",
    "shape": "circle"
  };
  return defaults[key];
}

// TODO: Pass in domain
encode = function(propval, visvar, dom) {
  if (visvar === "posx") {
    return encode_x(propval, dom);
  } else if (visvar === "posy") {
    return encode_y(propval, dom);
  } else if (visvar === "size") {
    return encode_size(propval);
  } else if (visvar === "color") {
    return encode_color(propval);
  } else if (visvar === "brightness") {
    return encode_brightness(propval);
  } else if (visvar === "texture") {
    return encode_texture(propval);
  } if (visvar === "orientation") {
    return encode_orientation(propval);
  } else if (visvar === "shape") {
    // never used as property encoding (as PoN => 1:1 mapping of concepts to symbols)
    console.error("shape should not be function");
  } else {
    console.error("invalid visual varaible");
  }
}
plot = function(data, instData, ctx, notation) {
  // g = render(100,100,"s3","b5","t3","green","rot30","rect");
  let posx = data.posx;
  let posy = data.posy;
  let size = data.size;
  let color = data.color;
  let brightness = data.brightness;
  let texture = data.texture;
  let orientation = data.orientation;
  
  let d = {};
  for (let k in data) {
    let v = data[k];
    if (typeof(v) === "object") {
      // Binding object
      let prop = v["bind"]
      var val;
      var propname;
      var skip = false;
      if (prop in notation) {
        // prop is a reference to another class
        propname = notation[prop][k]["bind"];
        val = ctx[propname];
        if (val === undefined) {
          console.log("unable to bind to prop: " + prop);
          skip = true;
        }
      } else if (prop in instData) {
        let instVal = instData[prop];
        propname = prop;
        val = instVal;
      } else {
        console.log("missing prop: " + prop);
        skip = true;
      }
      if (skip) {
        //For now, just use defaults (as no instance data)
        let default_val = get_default(k);
        d[k] = default_val;
      } else {
        var dom = {};
        // TODO: Read range/map from file
        if (propname === "x") {
          dom["min"] = 0;
          dom["max"] = 600;
        } else if (propname === "y") {
          dom["min"] = 0;
          dom["max"] = 500;
        } else if (propname === "angle") {
          dom["min"] = 0;
          dom["max"] = 360;
        } else if (propname === "timestamp") {
          dom["min"] = 20190101;
          dom["max"] = 20191230;
        }
        d[k] = encode(val, k, dom)
      }
    } else {
      // Constant.
      d[k] = v;
    }
  }
  
  //g = render(100,100,"s3","b5","t3","green","rot30","rect")
  let g = render(d.posx,d.posy,d.size,d.brightness,d.texture,d.color,d.orientation,d.shape);
  //document.getElementById("chart").appendChild(g);
  return g;
};

// TODO: Use schema to complement JSON
//       data with type names.
renderData = function(doc, name, obj, ctx, notation) {
  if (name in notation) {
    var n = notation[name];
    var g = plot(n, obj, ctx, notation);
    doc.appendChild(g);
  }
  for (let k in obj) {
    let v = obj[k];
    if (Array.isArray(v)) {
      for (let item of v) {
        //renderData(doc, k + "_item", item, obj, notation);
        renderData(doc, k, item, obj, notation);
      }
    } else if (typeof(v) === "object") {
      // current obj becomes context for inner obj
      renderData(doc, k, v, obj, notation);
    }
  }
}

window.addEventListener('DOMContentLoaded', (event) => {
  // Plot symbols in notation table
  // 'data' is a global defined in the html doc.
  console.log(data);
  for (let i in data) {
    let row = data[i]
    console.log("row: " + i);
    console.log(row);
    let g = plot(row, {}, {}, data);
    //document.getElementById("chart").appendChild(g);
    console.log(document.getElementById(i));
    let s = document.createElementNS(svgns, "svg");
    //s.setAttribute("viewBox","0 0 50 50")
    s.appendChild(g);
    document.getElementById(i).appendChild(s);
  }

  // Plot Vis
  // data => notation data, not to be confused with instance data
  // 'instData' is a global defined in the html doc.
  // console.log(instData);
  // let chart = document.getElementById("chart");
  // renderData(chart, "graph", instData, {}, data);
});
