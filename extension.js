
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const Meta = imports.gi.Meta;
const Ripples = imports.ui.ripples;
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;

const TOUCHX_SCHEMA = "org.gnome.shell.extensions.touchx";

class TouchXExtension {
    constructor(){
        this._schema = TOUCHX_SCHEMA;
        this._settings = null;
        this._ripples = null;
        this._pseudoDesktop = null;
    }

    _styleRipple(radius, bgcolor){

        const bgred = parseInt(parseFloat(bgcolor[0]) * 255);
        const bggreen = parseInt(parseFloat(bgcolor[1]) * 255);
        const bgblue = parseInt(parseFloat(bgcolor[2]) * 255);

        let ripStyle = `width: ${radius}px; height: ${radius}px; 
        border-radius: ${radius}px ${radius}px ${radius}px ${radius}px; 
        background-color: rgba(${bgred},${bggreen},${bgblue},0.5);
        box-shadow: 0 0 1px 1px rgba(255,255,255,0.2);`;

        this._ripples._ripple1.style = ripStyle;
        this._ripples._ripple2.style = ripStyle;
        this._ripples._ripple3.style = ripStyle;
    }

    _syncEnabled() {

        let enabled = this._settings.get_boolean('ripple');
        let radius = this._settings.get_int('radius');
        let bgcolor = this._settings.get_strv('bgcolor');

        if (!!this._ripples ){
            if (enabled){
                this._styleRipple(radius, bgcolor);
            }
            else {
                this._ripples.destroy();
                this._ripples = null;
            }
        }
        else{
            if (enabled){
                this._ripples = new Ripples.Ripples(0.5, 0.5, 'ripple-pointer-location');
                this._styleRipple(radius, bgcolor);
                this._ripples.addTo(Main.uiGroup);
            }
        }

    }

    show(x, y) {
        if (!this._ripples)
            return;

        this._ripples.playAnimation(x, y);
    }


    enable(){

        this._settings = ExtensionUtils.getSettings(this._schema);
        this._settings.connect(`changed::ripple`, () => this._syncEnabled());
        this._settings.connect(`changed::radius`, () => this._syncEnabled());
        this._settings.connect(`changed::bgcolor`, () => this._syncEnabled());
        this._syncEnabled();

        if (Meta.is_wayland_compositor()) {
            let pMonitor = Main.layoutManager.primaryMonitor;
            this._pseudoDesktop = new St.Bin({
                reactive: true,
                track_hover: false,
                can_focus: false,
                width: pMonitor.width,
                height: pMonitor.height,
                x_align: Clutter.ActorAlign.FILL,
                y_align: Clutter.ActorAlign.FILL,
            });
            this._pseudoDesktop.set_position(pMonitor.x, pMonitor.y);
            Main.layoutManager._backgroundGroup.add_child(this._pseudoDesktop);
        }

        global.stage.connect('touch-event', (actor, event) => {
            let type = event.type();
            if (type == Clutter.EventType.TOUCH_BEGIN){               
                let [x, y] = event.get_coords();
                this.show(x, y);
            }
            return Clutter.EVENT_PROPAGATE;
        });

    }


    disable() {
        
        if (!!this._ripples ){
            this._ripples.destroy();
            this._ripples = null;
        }   
        Main.layoutManager._backgroundGroup.remove_child(this._pseudoDesktop);
        this._pseudoDesktop.destroy();
        this._pseudoDesktop = null;
    }

}


function init() {
    ExtensionUtils.initTranslations();
    return new TouchXExtension();
}