/* @ds-bundle: {"format":4,"namespace":"CoachPro","components":[{"name":"Logo"},{"name":"Button"},{"name":"Badge"},{"name":"Avatar"},{"name":"Card"},{"name":"Field"},{"name":"StatTile"},{"name":"ProgressRing"},{"name":"ClientRow"}]} */
(function (global) {
  "use strict";
  var React = global.React;
  if (!React) { return; }
  var h = React.createElement;

  /* ----- icons (stroke = currentColor) ----- */
  function Svg(props, children) {
    var p = Object.assign({ viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
      strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, props);
    return h("svg", p, children);
  }
  var Icon = {
    check: function (k) { return Svg({ key: k }, h("path", { d: "M20 6 9 17l-5-5" })); },
    alert: function (k) { return Svg({ key: k }, [h("path", { key: "a", d: "M12 3 2 20h20L12 3z" }), h("path", { key: "b", d: "M12 10v4" }), h("circle", { key: "c", cx: 12, cy: 17, r: 0.6, fill: "currentColor", stroke: "none" })]); },
    x: function (k) { return Svg({ key: k }, [h("path", { key: "a", d: "M18 6 6 18" }), h("path", { key: "b", d: "M6 6l12 12" })]); },
    up: function (k) { return Svg({ key: k }, [h("path", { key: "a", d: "M7 17 17 7" }), h("path", { key: "b", d: "M8 7h9v9" })]); },
    down: function (k) { return Svg({ key: k }, [h("path", { key: "a", d: "M17 7 7 17" }), h("path", { key: "b", d: "M16 17H7V8" })]); },
    flat: function (k) { return Svg({ key: k }, h("path", { d: "M5 12h14" })); },
    plus: function (k) { return Svg({ key: k }, [h("path", { key: "a", d: "M12 5v14" }), h("path", { key: "b", d: "M5 12h14" })]); }
  };

  /* ----- Logo ----- */
  var MARK_D = "M30.37 37.22 A13.6 13.6 0 1 1 33.28 18.90 C37.78 16.90 39.28 11.90 43.50 5.50";
  function Mark(props) {
    var size = props.size || 32;
    var toneMap = { brand: "var(--brand)", ink: "var(--ink)", paper: "var(--ink-inverse)", current: "currentColor" };
    var stroke = toneMap[props.tone || "brand"] || toneMap.brand;
    return h("svg", { className: "cp-logo__mark", width: size, height: size, viewBox: "0 0 48 48",
      role: "img", "aria-label": props.title || "CoachPro" },
      h("path", { d: MARK_D, fill: "none", stroke: stroke, strokeWidth: 5.4, strokeLinecap: "round", strokeLinejoin: "round" }));
  }
  function Logo(props) {
    var variant = props.variant || "lockup";
    var size = props.size || 32;
    var tone = props.tone || "brand";
    if (variant === "mark") { return h(Mark, { size: size, tone: tone, title: props.title }); }
    var stacked = variant === "stacked";
    var wordSize = Math.round(size * 0.78);
    return h("span", { className: "cp-logo" + (stacked ? " cp-logo--stacked" : ""), style: props.style },
      h(Mark, { size: size, tone: tone, title: props.title }),
      h("span", { className: "cp-logo__word", style: { fontSize: wordSize } }, "CoachPro"));
  }

  /* ----- Button ----- */
  function Button(props) {
    var variant = props.variant || "primary";
    var size = props.size || "md";
    var cls = ["cp-btn", "cp-btn--" + variant, "cp-btn--" + size];
    if (props.full) { cls.push("cp-btn--full"); }
    if (props.className) { cls.push(props.className); }
    var kids = [];
    if (props.iconLeft) { kids.push(h("span", { className: "cp-btn__icon", key: "il" }, props.iconLeft)); }
    kids.push(h("span", { key: "lbl" }, props.children));
    if (props.iconRight) { kids.push(h("span", { className: "cp-btn__icon", key: "ir" }, props.iconRight)); }
    var tag = props.href ? "a" : "button";
    var attrs = { className: cls.join(" "), disabled: props.disabled, onClick: props.onClick, type: props.href ? undefined : (props.type || "button"), href: props.href };
    return h(tag, attrs, kids);
  }

  /* ----- Badge ----- */
  var BADGE = {
    "on-track": { cls: "pos", icon: Icon.check, label: "On track" },
    "at-risk": { cls: "warn", icon: Icon.alert, label: "At risk" },
    "off-track": { cls: "neg", icon: Icon.x, label: "Off track" },
    brand: { cls: "brand", icon: null, label: "" },
    neutral: { cls: "neutral", icon: null, label: "" },
    info: { cls: "info", icon: null, label: "" }
  };
  function Badge(props) {
    var status = props.status || "neutral";
    var cfg = BADGE[status] || BADGE.neutral;
    var kids = [];
    if (props.icon && cfg.icon) { kids.push(h("span", { className: "cp-badge__icon", key: "i" }, cfg.icon("ic"))); }
    else { kids.push(h("span", { className: "cp-badge__dot", key: "d" })); }
    kids.push(h("span", { key: "t" }, props.children != null ? props.children : cfg.label));
    return h("span", { className: "cp-badge cp-badge--" + cfg.cls }, kids);
  }

  /* ----- Avatar ----- */
  function initials(name) {
    if (!name) { return "?"; }
    var parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  }
  function Avatar(props) {
    var size = props.size || "md";
    var kids = [];
    if (props.src) { kids.push(h("img", { src: props.src, alt: props.name || "", key: "img" })); }
    else { kids.push(h("span", { key: "ini" }, props.initials || initials(props.name))); }
    if (props.status) { kids.push(h("span", { className: "cp-avatar__status cp-avatar__status--" + props.status, key: "st" })); }
    return h("span", { className: "cp-avatar cp-avatar--" + size, title: props.name }, kids);
  }

  /* ----- Card ----- */
  function Card(props) {
    var cls = ["cp-card"];
    if (props.muted) { cls.push("cp-card--muted"); }
    if (props.interactive) { cls.push("cp-card--interactive"); }
    if (props.className) { cls.push(props.className); }
    var head = null;
    if (props.title || props.action) {
      head = h("div", { className: "cp-card__head", key: "head" },
        h("div", { className: "cp-card__title" }, props.title),
        props.action ? h("div", { key: "a" }, props.action) : null);
    }
    return h("div", { className: cls.join(" "), onClick: props.onClick },
      head, h("div", { className: "cp-card__body", key: "body" }, props.children));
  }

  /* ----- Field ----- */
  function Field(props) {
    var cls = ["cp-field"];
    if (props.error) { cls.push("cp-field--error"); }
    var id = props.id || ("cp-f-" + Math.random().toString(36).slice(2, 7));
    var below = null;
    if (props.error) { below = h("span", { className: "cp-field__error", key: "e" }, Icon.alert("ei"), props.error); }
    else if (props.hint) { below = h("span", { className: "cp-field__hint", key: "hn" }, props.hint); }
    return h("label", { className: cls.join(" "), htmlFor: id },
      props.label ? h("span", { className: "cp-field__label", key: "l" }, props.label) : null,
      h("input", { className: "cp-field__input", id: id, type: props.type || "text",
        placeholder: props.placeholder, defaultValue: props.value, disabled: props.disabled, key: "in" }),
      below);
  }

  /* ----- StatTile ----- */
  function Delta(props) {
    var trend = props.trend || (props.value > 0 ? "up" : props.value < 0 ? "down" : "flat");
    var ic = trend === "up" ? Icon.up : trend === "down" ? Icon.down : Icon.flat;
    return h("span", { className: "cp-stat__delta cp-stat__delta--" + trend }, ic("di"),
      h("span", null, props.children));
  }
  function StatTile(props) {
    return h("div", { className: "cp-stat" + (props.className ? " " + props.className : "") },
      h("span", { className: "cp-stat__label", key: "l" }, props.label),
      h("div", { className: "cp-stat__row", key: "r" },
        h("span", { className: "cp-stat__value" }, props.value,
          props.unit ? h("span", { className: "cp-stat__unit" }, props.unit) : null),
        props.delta != null ? h(Delta, { trend: props.trend }, props.delta) : null),
      props.caption ? h("span", { className: "cp-stat__caption", key: "c" }, props.caption) : null);
  }

  /* ----- ProgressRing ----- */
  function ProgressRing(props) {
    var size = props.size || 104;
    var stroke = props.stroke || Math.max(7, Math.round(size * 0.09));
    var value = Math.max(0, Math.min(100, props.value == null ? 0 : props.value));
    var r = (size - stroke) / 2;
    var c = 2 * Math.PI * r;
    var off = c * (1 - value / 100);
    var vcls = "cp-ring__value" + (props.status ? " cp-ring__value--" + props.status : "");
    var num = props.num != null ? props.num : (value + "%");
    var numSize = props.numSize || Math.round(size * 0.26);
    return h("div", { className: "cp-ring", style: { width: size, height: size } },
      h("svg", { width: size, height: size },
        h("circle", { className: "cp-ring__track", cx: size / 2, cy: size / 2, r: r, strokeWidth: stroke }),
        h("circle", { className: vcls, cx: size / 2, cy: size / 2, r: r, strokeWidth: stroke,
          strokeDasharray: c, strokeDashoffset: off })),
      h("div", { className: "cp-ring__center" },
        h("span", { className: "cp-ring__num", style: { fontSize: numSize } }, num),
        props.sublabel ? h("span", { className: "cp-ring__sub", style: { fontSize: Math.max(10, Math.round(size * 0.1)) } }, props.sublabel) : null));
  }

  /* ----- Sparkline ----- */
  function Spark(props) {
    var data = props.data || [];
    var w = props.width || 72, ht = props.height || 28, pad = 2;
    if (data.length < 2) { return null; }
    var min = Math.min.apply(null, data), max = Math.max.apply(null, data);
    var span = (max - min) || 1;
    var step = (w - pad * 2) / (data.length - 1);
    var pts = data.map(function (v, i) {
      var x = pad + i * step;
      var y = pad + (ht - pad * 2) * (1 - (v - min) / span);
      return x.toFixed(1) + "," + y.toFixed(1);
    });
    var color = props.color || "var(--brand)";
    return h("svg", { className: "cp-trend-spark", width: w, height: ht, viewBox: "0 0 " + w + " " + ht, "aria-hidden": "true" },
      h("polyline", { points: pts.join(" "), fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }),
      h("circle", { cx: pts[pts.length - 1].split(",")[0], cy: pts[pts.length - 1].split(",")[1], r: 2.4, fill: color }));
  }

  /* ----- ClientRow ----- */
  var ROW_STATUS = { "on-track": "pos", "at-risk": "warn", "off-track": "neg" };
  function ClientRow(props) {
    var cls = ["cp-clientrow"];
    if (props.interactive !== false) { cls.push("cp-clientrow--interactive"); }
    if (props.status === "at-risk" || props.status === "off-track") { cls.push("cp-clientrow--flagged"); }
    var sparkColor = props.status === "off-track" ? "var(--neg)" : props.status === "at-risk" ? "var(--warn)" : "var(--pos)";
    return h("div", { className: cls.join(" "), onClick: props.onClick },
      h("div", { className: "cp-clientrow__id", key: "id" },
        h(Avatar, { name: props.name, src: props.src, size: "md", status: ROW_STATUS[props.status] }),
        h("div", { style: { minWidth: 0 } },
          h("div", { className: "cp-clientrow__name" }, props.name),
          h("div", { className: "cp-clientrow__meta" }, props.meta))),
      h("div", { className: "cp-clientrow__metrics", key: "m" },
        props.trend ? h("div", { className: "cp-clientrow__spark" }, h(Spark, { data: props.trend, color: sparkColor })) : null,
        h("div", { className: "cp-clientrow__adh" },
          h("span", { className: "cp-clientrow__adhnum" }, props.adherence + "%"),
          h("span", { className: "cp-clientrow__adhlabel" }, "Adherence")),
        h(Badge, { status: props.status, icon: true })));
  }

  global.CoachPro = {
    Logo: Logo, Mark: Mark, Button: Button, Badge: Badge, Avatar: Avatar, Card: Card,
    Field: Field, StatTile: StatTile, Delta: Delta, ProgressRing: ProgressRing,
    Spark: Spark, ClientRow: ClientRow, Icon: Icon
  };
})(typeof window !== "undefined" ? window : this);
