import Clutter from 'gi://Clutter';
import St from 'gi://St';
import Gio from 'gi://Gio';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as Ripples from 'resource:///org/gnome/shell/ui/ripples.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

const OsdWindowManager = Main.osdWindowManager;


export default class TouchXExtension extends Extension {
    constructor(metadata){
        super(metadata);
        this._settings = null;
        this._touchId = null;
        this._rtime = 10;
        this._seat = null;
        this._restoreTouchMode = null;
        this._oskBtn = null;
        this._icon = null;
        this._oskEnabledIcon = null;
        this._oskDisabledIcon = null;
        this._rippList = null;
    }

    _onOskBtnClicked(event){

        if (event.type() == Clutter.EventType.TOUCH_END ||
             (event.type() == Clutter.EventType.BUTTON_RELEASE && !event.is_pointer_emulated())){

                if (this._seat.get_touch_mode()) {
                this._seat.get_touch_mode = () => false;
                Main.keyboard._syncEnabled();

                this._icon.set_gicon(this._oskDisabledIcon);
                this._settings.set_boolean('lastoskon', false);
                OsdWindowManager.show(-1, this._oskDisabledIcon, "OSK Disabled");
                // console.log('Touch mode disabled');
            }
            else
            {
                this._seat.get_touch_mode = () => true;
                Main.keyboard._syncEnabled();

                this._icon.set_gicon(this._oskEnabledIcon);
                this._settings.set_boolean('lastoskon', true);
                OsdWindowManager.show(-1, this._oskEnabledIcon, "OSK Enabled");
                // console.log('Touch mode enabled');
            }

        }

        return Clutter.EVENT_PROPAGATE;

    }

    _createPanelOSK(){

        this._seat = Clutter.get_default_backend().get_default_seat();
        this._restoreTouchMode = this._seat.get_touch_mode;

        this._oskBtn = new PanelMenu.Button(0.0, 'touchModeBtn@touchx', true);

        let oskEnabledPath = this.path + "/media/osk-enabled-symbolic.svg";
        let oskDisabledPath = this.path + "/media/osk-disabled-symbolic.svg";
        this._oskEnabledIcon = Gio.FileIcon.new(Gio.File.new_for_path(oskEnabledPath));
        this._oskDisabledIcon = Gio.FileIcon.new(Gio.File.new_for_path(oskDisabledPath));
        let gicon;
        // read key 'lastoskon' from settings to set initial mode
        if (this._settings.get_boolean('lastoskon')){
            this._seat.get_touch_mode = () => true;
            gicon = this._oskEnabledIcon;
        }
        else{
            this._seat.get_touch_mode = () => false;
            gicon = this._oskDisabledIcon;
        }

        this._icon = new St.Icon({gicon: gicon, style_class : 'system-status-icon'});

        this._oskBtn.add_child(this._icon);
        Main.panel.addToStatusArea('touchModeBtn@touchx', this._oskBtn);
        this.oskBtnId = this._oskBtn.connect('captured-event', (actor, event) => this._onOskBtnClicked(event));

    }

    _removePanelOSK(){

        if (this.oskBtnId){
            this._oskBtn.disconnect(this.oskBtnId);
            this.oskBtnId = null;
        }

        if (this._oskBtn){
            this._oskBtn.destroy();
            this._oskBtn = null;
        }

        if (this._restoreTouchMode){
            this._seat.get_touch_mode = this._restoreTouchMode;
            this._restoreTouchMode = null;
        }

        this._seat = null;
        this._icon = null;
        this._oskEnabledIcon = null;
        this._oskDisabledIcon = null;

    }

    _setOsk() {
        const oskBtnOn = this._settings.get_boolean('oskbtn');
        // On oskBtnOn: create panel button. On oskBtnOff: remove panel button.
        if (oskBtnOn){
            if (!this._oskBtn){
                this._createPanelOSK();
            }
        }
        else{
            if (this._oskBtn){
                this._removePanelOSK();
            }
        }
    }

    _playAnimation(mode, widget, x, y, reanimate = true) {

        let rtime = this._rtime;
        if (widget._stage === undefined)
            throw new Error('Touch X: Widget not added to stage for '+mode);

        if (mode == 'touch') {
            const ripples = widget;
            ripples._x = x;
            ripples._y = y;

            ripples._stage.set_child_above_sibling(ripples._ripple1, null);
            ripples._stage.set_child_above_sibling(ripples._ripple2, ripples._ripple1);
            ripples._stage.set_child_above_sibling(ripples._ripple3, ripples._ripple2);

            if (reanimate) {
                // Show three concentric ripples expanding outwards; the exact parameters were found
                // by trial and error, so don't look for them to make perfect sense mathematically.
                // rtime (1 to 20) allows to customize ripple duration.
                //                                    delay     time        scale opacity => scale
                ripples._animRipple(ripples._ripple1, 0,        60*rtime,   0.2,   1.0,      1.15);
                ripples._animRipple(ripples._ripple2, 2*rtime,  70*rtime,   0.0,   0.7,      1.125);
                ripples._animRipple(ripples._ripple3, 3*rtime,  80*rtime,   0.0,   0.3,      1.0);
            } else {
                ripples._ripple1.set_position(x, y);
                ripples._ripple2.set_position(x, y);
                ripples._ripple3.set_position(x, y);
            }
        }

    }

    _show(mode, x, y, touchId) {

        if (!this._rippList)
            return;

        if (mode == 'touch') {
            for (const ripples of this._rippList) {
                if (!ripples._touchId) {
                    ripples._touchId = touchId;

                    this._playAnimation(mode, ripples, x, y, true);
                    return;
                }
            }
            throw new Error('Touch X: No free ripples for ' + touchId);
        }
    }

    _updateRipplePosition(x, y, touchId) {

        if (!this._rippList)
            return;

        /*console.log(`update: ${touchId}`);*/

        for (const ripples of this._rippList) {
            if (ripples._touchId === touchId) {
                this._playAnimation('touch', ripples, x, y , false);
                return;
            }
        }
        throw new Error('Touch X: No ripples for ' + touchId);
    }

    _hideRipple(touchId) {

        if (!this._rippList)
            return;

        for (const ripples of this._rippList) {
            if (ripples._touchId === touchId) {
                ripples._touchId = null;
                ripples._ripple1.opacity = 0;
                ripples._ripple2.opacity = 0;
                ripples._ripple3.opacity = 0;
                return;
            }
        }
        throw new Error('Touch X: No ripples for '+touchId);
    }

    _styleRipple(){

        if (!this._rippList)
            return;

        this._rtime = this._settings.get_int('time');
        const radius = this._settings.get_int('radius');
        const bgcolor = this._settings.get_strv('bgcolor');
        const bgred = parseInt(parseFloat(bgcolor[0]) * 255);
        const bggreen = parseInt(parseFloat(bgcolor[1]) * 255);
        const bgblue = parseInt(parseFloat(bgcolor[2]) * 255);

        let ripStyle = ` width: ${radius+2}px; height: ${radius+2}px; 
            background-color: rgba(${bgred},${bggreen},${bgblue},0.5); 
            box-shadow: 0 0 2px 2px rgba(${bgred},${bggreen},${bgblue},0.15); 
            border-radius: ${radius+2}px ${radius+2}px ${radius+2}px ${radius+2}px; `;

        for (const ripples of this._rippList) {
            ripples._ripple1.style = ripStyle;
            ripples._ripple2.style = ripStyle;
            ripples._ripple3.style = ripStyle;
        }

    }

    _setRipple() {
        const rippleOn = this._settings.get_boolean('ripple');
        if (rippleOn) {
            if (!this._rippList) {
                this._rippList = [];
                for (let i=0; i<12; i++) {
                    const ripples = new Ripples.Ripples(0.5, 0.5, 'touch-x-ripples');
                    ripples.addTo(Main.uiGroup);
                    this._rippList.push(ripples);
                }

            }
            this._styleRipple();

            if (!this._touchId) {
                this._touchId = global.stage.connect('captured-event::touch', (actor, event) => {
                    let [x, y] = event.get_coords();
                    let touchId = event.get_event_sequence().get_slot().toString();


                    if (event.type() == Clutter.EventType.TOUCH_BEGIN) {
                        this._show('touch', x, y, touchId);
                    } else if (event.type() == Clutter.EventType.TOUCH_UPDATE) {
                        this._updateRipplePosition(x, y, touchId);
                    } else if (event.type() == Clutter.EventType.TOUCH_END) {
                        this._hideRipple(touchId);
                    } else if (event.type() == Clutter.EventType.TOUCH_CANCEL) {
                        this._hideRipple(touchId);
                    }

                    return Clutter.EVENT_PROPAGATE;
                });
            }

        }
        else {
            if (this._rippList) {
                for (const ripples of this._rippList) {
                    ripples?.destroy();
                }
                this._rippList = null;
            }

            if (this._touchId){
                global.stage.disconnect(this._touchId);
                this._touchId = null;
            }
        }

    }

    enable(){

        this._settings = this.getSettings();
        this._settings.connect(`changed::ripple`, () => this._setRipple());
        [`changed::radius`, `changed::bgcolor`, `changed::time`].forEach(event => {
            this._settings.connect(event, () => this._styleRipple());
        });
        this._settings.connect(`changed::oskbtn`, () => this._setOsk());

        this._setRipple();
        this._setOsk();

    }


    disable() {

        if (this._touchId){
            global.stage.disconnect(this._touchId);
            this._touchId = null;
        }

        if (this._rippList) {
            for (const ripples of this._rippList) {
                ripples?.destroy();
            }
            this._rippList = null;
        }

        /* this._removePanelOSK():
        * - disconnect oskBtn, set oskBtnId null
        * - destroy oskBtn, set null
        * - restore seat.get_touch_mode, set _restoreToucMode null
        * - set this._seat, this._icon to null
        * - set this._oskEnabledIcon, this._oskDisabledIcon to null
        */
        this._removePanelOSK();

        this._settings = null;
        this._rtime = null;
    }

}
