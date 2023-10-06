const Clutter = imports.gi.Clutter;
const Ripples = imports.ui.ripples;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const St = imports.gi.St;
const Gio = imports.gi.Gio;
const OsdWindowManager = Main.osdWindowManager;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Cairo = imports.cairo;

const TOUCHX_SCHEMA = "org.gnome.shell.extensions.touchx";

class TouchXExtension {
    constructor(){
        this._schema = TOUCHX_SCHEMA;
        this._settings = null;
        // this._ripples = null;
        this._touchId = null;
        this._rtime = 10;
        this._seat = null;
        this._restoreTouchMode = null;
        this._oskBtn = null;
        this._icon = null;
        this._oskEnabledIcon = null;
        this._oskDisabledIcon = null;
        this._rippList = null;
        // this._touchAnim = false;
        this.touchSequence = null;
    }

    // TBD: A function that enables the screen to autorotate even when the touchscreen computer is not in tablet mode.
    // The functionality exists in gnome-shell, but it is only enabled when the computer is in tablet mode.
    // This function should override the check for tablet mode so that Gnome shell can autorotate the screen.
    // _enableAutorotate() {
      

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

    // _animRipple(ripple, delay, duration, startScale, startOpacity, finalScale) {
    //     // We draw a ripple by using a source image and animating it scaling
    //     // outwards and fading away. We want the ripples to move linearly
    //     // or it looks unrealistic, but if the opacity of the ripple goes
    //     // linearly to zero it fades away too quickly, so we use a separate
    //     // tween to give a non-linear curve to the fade-away and make
    //     // it more visible in the middle section.

    //     ripple.x = this._ripples._x;
    //     ripple.y = this._ripples._y;
    //     ripple.visible = true;
    //     ripple.opacity = 255 * Math.sqrt(startOpacity);
    //     ripple.scale_x = ripple.scale_y = startScale;
    //     ripple.set_translation(-this._ripples._px * ripple.width, -this._ripples._py * ripple.height, 0.0);

    //     ripple.ease({
    //         opacity: 0,
    //         delay,
    //         duration,
    //         mode: Clutter.AnimationMode.EASE_IN_QUAD,
    //     });
    //     ripple.ease({
    //         scale_x: finalScale,
    //         scale_y: finalScale,
    //         delay,
    //         duration,
    //         mode: Clutter.AnimationMode.LINEAR,
    //         onComplete: () => (ripple.visible = false),
    //     });
    // }

    _animTrace(trace, delay, duration, startScale, startOpacity, finalScale) {

        trace.visible = true;
        trace.opacity = 255 * Math.sqrt(startOpacity);
        trace.scale_x = trace.scale_y = startScale;
        trace.set_translation(-trace._px * trace.width, -trace._py * trace.height, 0.0);

        trace.ease({
            opacity: 0,
            delay,
            duration,
            mode: Clutter.AnimationMode.EASE_IN_QUAD,
        });
        trace.ease({
            scale_x: finalScale,
            scale_y: finalScale,
            delay,
            duration,
            mode: Clutter.AnimationMode.LINEAR,
            onComplete: () => (trace.visible = false),
        });
    }

    _playAnimation(mode, widget, x, y) {
        
        let rtime = this._rtime;
        if (widget._stage === undefined)
            throw new Error('Touch X: Widget not added to stage for '+mode);

        if (mode == 'touch') {
            const ripples = widget
            ripples._x = x;
            ripples._y = y;

            ripples._stage.set_child_above_sibling(ripples._ripple1, null);
            ripples._stage.set_child_above_sibling(ripples._ripple2, ripples._ripple1);
            ripples._stage.set_child_above_sibling(ripples._ripple3, ripples._ripple2);

            // Show three concentric ripples expanding outwards; the exact parameters were found  
            // by trial and error, so don't look for them to make perfect sense mathematically.
            // rtime (1 to 20) allows to customize ripple duration.
            //                                    delay     time        scale opacity => scale
            ripples._animRipple(ripples._ripple1, 0,        60*rtime,   0.2,   1.0,      1.15);
            ripples._animRipple(ripples._ripple2, 2*rtime,  70*rtime,   0.0,   0.7,      1.125);
            ripples._animRipple(ripples._ripple3, 3*rtime,  80*rtime,   0.0,   0.3,      1.0);

        }
        else { // mode: 'trace'
            const trace = widget;
            trace.x = x;
            trace.y = y;
            //                     delay  time      scale   opacity => scale
            this._animTrace(trace, 0,     50*rtime, 1,      1.0,         0);
        }
    }

    _show(mode, x, y) {

        if (!this._rippList)
            return;

        if (mode == 'touch') {
            for (const ripples of this._rippList) {
                if (!ripples._ripple3.visible) {
                    this._playAnimation(mode, ripples, x, y);
                    return;
                }            
            }
            this._playAnimation(mode, this._rippList[0], x, y);
        }
        else { //mode == 'trace'
            for (const trace of this._traceList) {
                if (!trace.visible) {
                    this._playAnimation(mode, trace, x, y);
                    return;
                }            
            }
            this._playAnimation(mode, this._traceList[0], x, y);
        }
    }

    _styleRipple() {

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

        for (const trace of this._traceList) {
            const d = (radius+2)*0.2;
            trace.style = ` width: ${d}px; height: ${d}px; 
            background-color: rgba(${bgred},${bggreen},${bgblue},0.5); 
            box-shadow: 0 0 1px 1px rgba(${bgred},${bggreen},${bgblue},0.15); 
            border-radius: ${d}px ${d}px ${d}px ${d}px; `;
        }
   
    }

    _setRipple() {
        const rippleOn = this._settings.get_boolean('ripple');
        if (rippleOn) {
            if (!this._rippList) {
                this._rippList = [];
                for (let i=0; i<15; i++) {
                    const ripples = new Ripples.Ripples(0.5, 0.5, 'touch-x-ripples');
                    ripples.addTo(Main.uiGroup);
                    this._rippList.push(ripples);
                }
                
                this._traceList = [];
                for (let i=0; i<100; i++) {
                    const trace = new St.BoxLayout({
                        style_class: 'touch-x-trace',
                        opacity: 0,
                        can_focus: false,
                        reactive: false,
                        visible: false,
                    });
                    trace._px = trace._py = 0.5;
                    trace.set_pivot_point(0.5, 0.5);
                    Main.uiGroup.add_actor(trace);
                    trace._stage = Main.uiGroup;
                    this._traceList.push(trace);
                }
            }
            this._styleRipple();

            if (!this._touchId) {
                this._touchId = global.stage.connect('captured-event::touch', (actor, event) => { //log('event type '+event.type());
                    let [x, y] = event.get_coords(); // log('x, y'+x+' '+y);
                    if (event.type() == Clutter.EventType.TOUCH_BEGIN) {    
                        this.touchSequence = event.get_event_sequence();
                        this._show('touch', x, y);
                    }
                    else if (event.type() == Clutter.EventType.TOUCH_UPDATE) { //log('x, y'+x+' '+y);
                        if (this.touchSequence)
                            this._show('trace', x, y);
                    }
                    else if (event.type() == Clutter.EventType.TOUCH_END || event.type() == Clutter.EventType.TOUCH_CANCEL) {
                        this.touchSequence = null;
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

        this._settings = ExtensionUtils.getSettings(this._schema);
        this._settings.connect(`changed::ripple`, () => this._setRipple());
        [`changed::radius`, `changed::bgcolor`, `changed::time`].forEach(event => {
            this._settings.connect(event, () => this._styleRipple());
        });
        this._settings.connect(`changed::oskbtn`, () => this._setOsk());

        this._setRipple();
        // this._styleRipple();
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

        this._removePanelOSK();

        this._settings = null;
    }

}


function init() {
    ExtensionUtils.initTranslations();
    return new TouchXExtension();
}
