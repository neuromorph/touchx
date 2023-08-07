const Clutter = imports.gi.Clutter;
const Ripples = imports.ui.ripples;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const St = imports.gi.St;
const Gio = imports.gi.Gio;
const OsdWindowManager = Main.osdWindowManager;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const TOUCHX_SCHEMA = "org.gnome.shell.extensions.touchx";

class TouchXExtension {
    constructor(){
        this._schema = TOUCHX_SCHEMA;
        this._settings = null;
        this._ripples = null;
        this._touchId = null;
        this._rtime = 10;
        this._seat = null;
        this._restoreTouchMode = null;
        this._oskBtn = null;
        this._icon = null;
        this._oskEnabledIcon = null;
        this._oskDisabledIcon = null;
    }

    _styleRipple(radius, bgcolor){

        const bgred = parseInt(parseFloat(bgcolor[0]) * 255);
        const bggreen = parseInt(parseFloat(bgcolor[1]) * 255);
        const bgblue = parseInt(parseFloat(bgcolor[2]) * 255);
        
        let ripStyle = ` width: ${radius+2}px; height: ${radius+2}px; 
            background-color: rgba(${bgred},${bggreen},${bgblue},0.5); 
            box-shadow: 0 0 2px 2px rgba(${bgred},${bggreen},${bgblue},0.2); 
            border-radius: ${radius+2}px ${radius+2}px ${radius+2}px ${radius+2}px; `;
        
        this._ripples._ripple1.style = ripStyle;
        this._ripples._ripple2.style = ripStyle;
        this._ripples._ripple3.style = ripStyle;
   
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
                // log('Touch mode disabled');
            }
            else 
            {
                this._seat.get_touch_mode = () => true;
                Main.keyboard._syncEnabled();

                this._icon.set_gicon(this._oskEnabledIcon);
                this._settings.set_boolean('lastoskon', true);
                OsdWindowManager.show(-1, this._oskEnabledIcon, "OSK Enabled");
                // log('Touch mode enabled');
            }

        }

        return Clutter.EVENT_PROPAGATE;   

    }

    _createPanelOSK(){

        this._seat = Clutter.get_default_backend().get_default_seat();
        this._restoreTouchMode = this._seat.get_touch_mode;

        this._oskBtn = new PanelMenu.Button(0.0, 'touchModeBtn@touchx', true);

        let iconDir = Me.dir.get_child('media');
        let oskEnabledPath = iconDir.get_child("osk-enabled-symbolic.svg").get_path();
        let oskDisabledPath = iconDir.get_child("osk-disabled-symbolic.svg").get_path();
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

    _syncSettings() {

        const rippleOn = this._settings.get_boolean('ripple');
        const radius = this._settings.get_int('radius');
        const bgcolor = this._settings.get_strv('bgcolor');
        const oskBtnOn = this._settings.get_boolean('oskbtn');
        this._rtime = this._settings.get_int('time');

        // On rippleOn: create or style ripple. On rippleOff: destroy ripple.
        if (this._ripples ){
            if (rippleOn){
                this._styleRipple(radius, bgcolor);
            }
            else {
                this._ripples.destroy();
                this._ripples = null;
            }
        }
        else{
            if (rippleOn){
                this._ripples = new Ripples.Ripples(0.5, 0.5, 'ripple-pointer-location');
                this._styleRipple(radius, bgcolor);
                this._ripples.addTo(Main.uiGroup);
            }
        }

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

    _playAnimation(x, y) {
        
        let rtime = this._rtime;
        if (this._ripples._stage === undefined)
            throw new Error('Ripples not added');

        this._ripples._x = x;
        this._ripples._y = y;

        this._ripples._stage.set_child_above_sibling(this._ripples._ripple1, null);
        this._ripples._stage.set_child_above_sibling(this._ripples._ripple2, this._ripples._ripple1);
        this._ripples._stage.set_child_above_sibling(this._ripples._ripple3, this._ripples._ripple2);

        // Show three concentric ripples expanding outwards; the exact parameters were found  
        // by trial and error, so don't look for them to make perfect sense mathematically.
        // rtime (1 to 20) allows to customize ripple duration.
        //                                                delay     time        scale opacity => scale
        this._ripples._animRipple(this._ripples._ripple1, 0,        70*rtime,   0.25,  1.0,      1.5);
        this._ripples._animRipple(this._ripples._ripple2, 5*rtime,  90*rtime,   0.0,   0.7,      1.25);
        this._ripples._animRipple(this._ripples._ripple3, 35*rtime, 100*rtime,  0.0,   0.3,      1);
    }

    _show(x, y) {

        if (!this._ripples)
            return;

        this._playAnimation(x, y);
    }

    enable(){

        this._settings = ExtensionUtils.getSettings(this._schema);
        this._settings.connect(`changed::ripple`, () => this._syncSettings());
        this._settings.connect(`changed::radius`, () => this._syncSettings());
        this._settings.connect(`changed::bgcolor`, () => this._syncSettings());
        this._settings.connect(`changed::time`, () => this._syncSettings());
        this._settings.connect(`changed::oskbtn`, () => this._syncSettings());
        this._syncSettings();

        this._touchId = global.stage.connect('captured-event::touch', (actor, event) => {

            if (event.type() == Clutter.EventType.TOUCH_BEGIN){               
                let [x, y] = event.get_coords();
                this._show(x, y);
            }
            
            return Clutter.EVENT_PROPAGATE;
        });

    }


    disable() {
        
        if (this._touchId){
            global.stage.disconnect(this._touchId);
            this._touchId = null;
        }

        if (this._ripples ){
            this._ripples.destroy();
            this._ripples = null;
        }  

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
        this._settings = null;
    }

}


function init() {
    ExtensionUtils.initTranslations();
    return new TouchXExtension();
}