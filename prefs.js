import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import Adw from 'gi://Adw'; 

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';


export default class TouchXPreferences extends ExtensionPreferences {

  fillPreferencesWindow(window) {

    window.default_height = 620;
    window.default_width = 610;

    const settingsPage = new Adw.PreferencesPage({
      name: 'settings',
      title: _('Settings'),
      icon_name: 'emblem-system-symbolic',
    });
    window.add(settingsPage);

    const settingsGroup = new Adw.PreferencesGroup();
    settingsPage.add(settingsGroup);

    const grid = new Gtk.Grid();
    grid.margin_top = 15;
    grid.margin_bottom = grid.margin_top;
    grid.margin_start = 40;
    grid.margin_end = grid.margin_start;
    grid.row_spacing = 6;
    grid.column_spacing = grid.row_spacing;
    grid.orientation = Gtk.Orientation.VERTICAL;

    const _settings = this.getSettings();

    let rowNo = 1;

    let title_label = new Gtk.Label({
      use_markup: true,
      label: `<span size="large" weight="heavy">Touch X</span>`,
      hexpand: true,
      halign: Gtk.Align.CENTER
    });
    grid.attach(title_label, 1, rowNo, 2, 1);

    rowNo += 2
    let version_label = new Gtk.Label({
      use_markup: true,
      label: `<span size="small">${_('Version:')} ${this.metadata.version}  |  © neuromorph</span>`,
      hexpand: true,
      halign: Gtk.Align.CENTER,
    });
    grid.attach(version_label, 1, rowNo, 2, 1);

    rowNo += 1
    let link_label = new Gtk.Label({
      use_markup: true,
      label: `<span size="small"><a href="${this.metadata.url}">${this.metadata.url}</a></span>`,
      hexpand: true,
      halign: Gtk.Align.CENTER,
      margin_bottom: grid.margin_bottom,
    });
    grid.attach(link_label, 1, rowNo, 2, 1);

    //-------------------------------------------------------

    rowNo += 2

    let separator = new Gtk.Separator({
      orientation: Gtk.Orientation.HORIZONTAL,
      hexpand: true,
      margin_bottom: grid.margin_bottom,
      margin_top: grid.margin_top,
    });
    grid.attach(separator, 1, rowNo, 2, 1);

    //-------------------------------------------------------

    rowNo += 2
  
    let ripple = new Gtk.Switch({halign: Gtk.Align.END});
    ripple.set_active(_settings.get_boolean("ripple"));

    ripple.connect(
      "state-set",
      function (w) {
        var value = w.get_active();
        _settings.set_boolean("ripple", value);
      }.bind(this)
    );

    let rippleLabel = new Gtk.Label({
      label: "Touch Ripple :",
      use_markup: true,
      halign: Gtk.Align.START,
      
    });

    grid.attach(rippleLabel, 1, rowNo, 1, 1);
    grid.attach(ripple, 2, rowNo, 1, 1);

    //-------------------------------------------------------

    rowNo += 4

    let radius = new Gtk.SpinButton({halign: Gtk.Align.END});
    radius.set_sensitive(true);
    radius.set_range(5, 100);
    radius.set_value(50);
    radius.width_chars = 4;
    radius.set_value(_settings.get_int("radius"));
    radius.set_increments(1, 5);

    radius.connect(
      "value-changed",
      function (w) {
        var value = w.get_value_as_int();
        _settings.set_int("radius", value);
      }.bind(this)
    );

    let radiusLabel = new Gtk.Label({
      label: 'Ripple Radius :',
      use_markup: true,
      halign: Gtk.Align.START,
    });

    grid.attach(radiusLabel,   1, rowNo, 1, 1);
    grid.attach(radius, 2, rowNo, 1, 1);

    //-------------------------------------------------------

    rowNo += 2

    let bgcolorBtn = new Gtk.ColorButton({halign: Gtk.Align.END});
    let bgcolorArray = _settings.get_strv('bgcolor');
    let bgrgba = new Gdk.RGBA();
    bgrgba.red = parseFloat(bgcolorArray[0]);
    bgrgba.green = parseFloat(bgcolorArray[1]);
    bgrgba.blue = parseFloat(bgcolorArray[2]);
    bgrgba.alpha = 1.0;
    bgcolorBtn.set_rgba(bgrgba);

    bgcolorBtn.connect('color-set', (widget) => {
      bgrgba = widget.get_rgba();
      _settings.set_strv('bgcolor', [
        bgrgba.red.toString(),
        bgrgba.green.toString(),
        bgrgba.blue.toString()
      ]);
    });


    let bgcolorLabel = new Gtk.Label({
      label: "Ripple Color :",
      use_markup: true,
      halign: Gtk.Align.START,
    });


    grid.attach(bgcolorLabel, 1, rowNo, 1, 1);
    grid.attach(bgcolorBtn, 2, rowNo, 1, 1);

    //-------------------------------------------------------

    rowNo += 2

    let time = new Gtk.SpinButton({halign: Gtk.Align.END});
    time.set_sensitive(true);
    time.set_range(1, 20);
    time.set_value(10);
    time.width_chars = 4;
    time.set_value(_settings.get_int("time"));
    time.set_increments(1, 2);

    time.connect(
      "value-changed",
      function (w) {
        var value = w.get_value_as_int();
        _settings.set_int("time", value);
      }.bind(this)
    );

    let timeLabel = new Gtk.Label({
      label: 'Ripple Time :',
      use_markup: true,
      halign: Gtk.Align.START,
    });

    grid.attach(timeLabel,   1, rowNo, 1, 1);
    grid.attach(time, 2, rowNo, 1, 1);

    //-------------------------------------------------------

    rowNo += 3
    let separator2 = new Gtk.Separator({
      orientation: Gtk.Orientation.HORIZONTAL,
      hexpand: true,
      margin_top: grid.margin_top/2,
      margin_bottom: grid.margin_bottom/2,
    });
    grid.attach(separator2, 1, rowNo, 2, 1);

    //-------------------------------------------------------

    rowNo += 2
    let oskBtn = new Gtk.Switch({halign: Gtk.Align.END, valign: Gtk.Align.CENTER});
    oskBtn.set_active(_settings.get_boolean("oskbtn"));

    oskBtn.connect(
      "state-set",
      function (w) {
        var value = w.get_active();
        _settings.set_boolean("oskbtn", value);
      }.bind(this)
    );

    let oskBtnLabel = new Gtk.Label({
      label: `OSK Panel Button :<span size="small" weight="light">
      A toggle button in panel to force enable/disable On Screen Keyboard.
      Works regardless of accessibility setting or touch-mode status.</span>`,
      use_markup: true,
      halign: Gtk.Align.START,
    });

    grid.attach(oskBtnLabel, 1, rowNo, 1, 3);
    grid.attach(oskBtn, 2, rowNo, 1, 1);

    //-------------------------------------------------------

    rowNo += 4
    let separator3 = new Gtk.Separator({
      orientation: Gtk.Orientation.HORIZONTAL,
      hexpand: true,
      margin_top: grid.margin_top,
    });
    grid.attach(separator3, 1, rowNo, 2, 1);

    //-------------------------------------------------------

    rowNo+=2
    let noteLabel = new Gtk.Label({
      label: `<span allow_breaks="true" size="small" underline="none">
      • Enable Touch Ripple to get feedback ripple on touch.
      • Use Radius, Color and Time to customize ripple appearance.
      • Turn On OSK Panel Button to force enable/disable OSK.

                      Visit  <a href="${this.metadata.url}">Touch X</a>  page for more details. </span>`,
      use_markup: true,
      hexpand: true,
      halign: Gtk.Align.CENTER,
      wrap: true,
      width_chars: 40,
      margin_top: 1,
    });

    grid.attach(noteLabel, 1, rowNo, 2, 1);

    settingsGroup.add(grid);
  }
}

