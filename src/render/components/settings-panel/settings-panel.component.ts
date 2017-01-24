import {Component, HostListener, Input, EventEmitter, Output} from '@angular/core';
import {State} from '../../providers/state.service.';
import {ParamUpdate, Visualization} from '../../../common/models';
import {MIN_SAMPLE_RATE, MAX_SAMPLE_RATE} from '../../../common/constants';

declare const VERSION: string;

@Component({
    selector: 'settings-panel',
    templateUrl: './settings-panel.component.html',
    styleUrls: ['./settings-panel.scss']
})
export class SettingsPanel {
    @Input() current: Visualization;
    @Output() changeInputDeviceId = new EventEmitter<number>();
    @Output() setSampleRate = new EventEmitter<number>();
    @Output() updateParam = new EventEmitter<ParamUpdate>();
    minSampleRate = MIN_SAMPLE_RATE;
    maxSampleRate = MAX_SAMPLE_RATE;
    iconVisible: boolean = false;
    expanded: boolean = false;
    version: string = VERSION;
    private hoverTimer: any;

    constructor(public state: State) {}

    ngOnDestroy(): void {
        clearTimeout(this.hoverTimer);
    }

    @HostListener('document:mouseenter')
    onMouseOver(): void {
        this.displayUiElements();
    }

    @HostListener('document:mousemove')
    onMouseMove(): void {
        this.displayUiElements();
    }

    @HostListener('document:mouseleave')
    onMouseOut(): void {
        this.iconVisible = false;
    }

    /**
     * Display the UI controls (visualization selector, settings icons) and set a timeout
     * to hide them again after a delay.
     */
    displayUiElements(): void {
        this.iconVisible = true;

        clearTimeout(this.hoverTimer);
        this.hoverTimer = setTimeout(() => {
            if (!this.expanded) {
                this.iconVisible = false;
            }
        }, 3000);
    }
} 
