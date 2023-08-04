const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;

const Gettext = imports.gettext.domain("touchx");
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const TOUCHX_SCHEMA = "org.gnome.shell.extensions.touchx";
//-----------------------------------------------

function init() {
  ExtensionUtils.initTranslations();
}

//-----------------------------------------------

const TouchXSettingsWidget = new GObject.registerClass(
  {
    GTypeName: "TouchXPrefsWidget",
  },
  class TouchXSettingsWidget extends Gtk.Grid {
    _init(params) {
      super._init(params);
      this.margin_top = 15;
      this.margin_bottom = this.margin_top;
      this.margin_start = 48;
      this.margin_end = this.margin_start;
      this.row_spacing = 6;
      this.column_spacing = this.row_spacing;
      this.orientation = Gtk.Orientation.VERTICAL;

      this._settings = ExtensionUtils.getSettings(TOUCHX_SCHEMA);

      let rowNo = 1;

      this.title_label = new Gtk.Label({
        use_markup: true,
        label: `<span size="large" weight="heavy">Touch X</span>`,
        hexpand: true,
        halign: Gtk.Align.CENTER
      });
      this.attach(this.title_label, 1, rowNo, 2, 1);

      rowNo += 2
      this.version_label = new Gtk.Label({
        use_markup: true,
        label: `<span size="small">${_('Version:')} ${Me.metadata.version}  |  © neuromorph</span>`,
        hexpand: true,
        halign: Gtk.Align.CENTER,
      });
      this.attach(this.version_label, 1, rowNo, 2, 1);

      rowNo += 1
      this.link_label = new Gtk.Label({
        use_markup: true,
        label: `<span size="small"><a href="${Me.metadata.url}">${Me.metadata.url}</a></span>`,
        hexpand: true,
        halign: Gtk.Align.CENTER,
        margin_bottom: this.margin_bottom,
      });
      this.attach(this.link_label, 1, rowNo, 2, 1);

      //-------------------------------------------------------

      rowNo += 2

      this.separator = new Gtk.Separator({
        orientation: Gtk.Orientation.HORIZONTAL,
        hexpand: true,
        margin_bottom: this.margin_bottom,
        margin_top: this.margin_top,
        // visible: true,
      });
      this.attach(this.separator, 1, rowNo, 2, 1);

      //-------------------------------------------------------

      rowNo += 2
    
      this.ripple = new Gtk.Switch({halign: Gtk.Align.END});
      this.ripple.set_active(this._settings.get_boolean("ripple"));

      this.ripple.connect(
        "state-set",
        function (w) {
          var value = w.get_active();
          this._settings.set_boolean("ripple", value);
        }.bind(this)
      );

      this.rippleLabel = new Gtk.Label({
        label: "Touch Ripple :",
        use_markup: true,
        halign: Gtk.Align.START,
        
      });

      this.attach(this.rippleLabel, 1, rowNo, 1, 1);
      this.attach(this.ripple, 2, rowNo, 1, 1);

      //-------------------------------------------------------

      rowNo += 4

      this.radius = new Gtk.SpinButton({halign: Gtk.Align.END});
      this.radius.set_sensitive(true);
      this.radius.set_range(5, 100);
      this.radius.set_value(50);
      this.radius.width_chars = 4;
      this.radius.set_value(this._settings.get_int("radius"));
      this.radius.set_increments(1, 5);

      this.radius.connect(
        "value-changed",
        function (w) {
          var value = w.get_value_as_int();
          this._settings.set_int("radius", value);
        }.bind(this)
      );

      this.radiusLabel = new Gtk.Label({
        label: 'Ripple Radius :',
        use_markup: true,
        halign: Gtk.Align.START,
      });

      this.attach(this.radiusLabel,   1, rowNo, 1, 1);
	    this.attach(this.radius, 2, rowNo, 1, 1);

      //-------------------------------------------------------

      rowNo += 2

      this.bgcolorBtn = new Gtk.ColorButton({halign: Gtk.Align.END});
      let bgcolorArray = this._settings.get_strv('bgcolor');
  		let bgrgba = new Gdk.RGBA();
      bgrgba.red = parseFloat(bgcolorArray[0]);
      bgrgba.green = parseFloat(bgcolorArray[1]);
      bgrgba.blue = parseFloat(bgcolorArray[2]);
      bgrgba.alpha = 1.0;
      this.bgcolorBtn.set_rgba(bgrgba);

      this.bgcolorBtn.connect('color-set', (widget) => {
        bgrgba = widget.get_rgba();
        this._settings.set_strv('bgcolor', [
          bgrgba.red.toString(),
          bgrgba.green.toString(),
          bgrgba.blue.toString()
        ]);
      });


      this.bgcolorLabel = new Gtk.Label({
        label: "Ripple Color :",
        use_markup: true,
        halign: Gtk.Align.START,
      });


      this.attach(this.bgcolorLabel, 1, rowNo, 1, 1);
      this.attach(this.bgcolorBtn, 2, rowNo, 1, 1);

      //-------------------------------------------------------

      rowNo += 2

      this.time = new Gtk.SpinButton({halign: Gtk.Align.END});
      this.time.set_sensitive(true);
      this.time.set_range(1, 20);
      this.time.set_value(10);
      this.time.width_chars = 4;
      this.time.set_value(this._settings.get_int("time"));
      this.time.set_increments(1, 2);

      this.time.connect(
        "value-changed",
        function (w) {
          var value = w.get_value_as_int();
          this._settings.set_int("time", value);
        }.bind(this)
      );

      this.timeLabel = new Gtk.Label({
        label: 'Ripple Time :',
        use_markup: true,
        halign: Gtk.Align.START,
      });

      this.attach(this.timeLabel,   1, rowNo, 1, 1);
      this.attach(this.time, 2, rowNo, 1, 1);

      //-------------------------------------------------------

      rowNo += 2
      this.separator2 = new Gtk.Separator({
        orientation: Gtk.Orientation.HORIZONTAL,
        hexpand: true,
        margin_top: this.margin_top,
      });
      this.attach(this.separator2, 1, rowNo, 2, 1);

      //-------------------------------------------------------

      rowNo+=2
      this.noteLabel = new Gtk.Label({
        label: `<span allow_breaks="true" size="small" underline="none">
        • Enable Touch Ripple to get feedback ripple on touch.
        • Use Radius, Color and Time to customize ripple appearance.

                        Visit  <a href="${Me.metadata.url}">Touch X</a>  page for more details. </span>`,
        use_markup: true,
        hexpand: true,
        halign: Gtk.Align.START,
        wrap: true,
        width_chars: 40,
        margin_top: 1,
      });

      this.attach(this.noteLabel, 1, rowNo, 2, 1);


    }
  }
);


function buildPrefsWidget() {
  let prefWidget =  new TouchXSettingsWidget();
  prefWidget.connect("realize", ()=>{
    const window = prefWidget.get_root();
    window.set_title(_("Touch X"));
    window.default_height = 525;
    window.default_width = 500;
  });
  return prefWidget;
}