import { Component, OnInit, ElementRef, ViewChild, Input } from '@angular/core';
import { Subject } from 'rxjs';

import { ApiService } from '@/app/core/api.service';
import { WsService } from '@/app/core/ws.service';

@Component({
  selector: 'app-hap-qrcode-widget',
  templateUrl: './hap-qrcode-widget.component.html',
  styleUrls: ['./hap-qrcode-widget.component.scss'],
})
export class HapQrcodeWidgetComponent implements OnInit {
  @ViewChild('qrcode', { static: true }) qrcodeElement: ElementRef;
  @ViewChild('pincode', { static: true }) pincodeElement: ElementRef;
  @ViewChild('qrcodecontainer', { static: true }) qrcodeContainerElement: ElementRef;

  @Input() resizeEvent: Subject<any>;

  private loadedQrCode: boolean;
  private io = this.$ws.getExistingNamespace('status');

  public pin = 'Loading...';
  public qrCodeHeight;
  public qrCodeWidth;

  constructor(
    private $api: ApiService,
    private $ws: WsService,
  ) { }

  ngOnInit() {
    this.resizeQrCode();

    this.io.socket.on('homebridge-status', (data) => {
      this.getQrCodeImage();
      this.pin = data.pin;
    });

    if (this.io.socket.connected) {
      this.getQrCodeImage();
      this.getPairingPin();
    }

    this.io.socket.on('disconnect', () => {
      this.loadedQrCode = false;
    });

    // subscribe to grid resize events
    this.resizeEvent.subscribe({
      next: () => {
        this.resizeQrCode();
      },
    });
  }

  resizeQrCode() {
    const containerHeight = (this.qrcodeContainerElement.nativeElement as HTMLElement).offsetHeight;
    const containerWidth = (this.qrcodeContainerElement.nativeElement as HTMLElement).offsetWidth;
    const pinCodeHeight = (this.pincodeElement.nativeElement as HTMLElement).offsetHeight;

    this.qrCodeHeight = containerHeight - pinCodeHeight;
    this.qrCodeWidth = containerWidth > this.qrCodeHeight ? this.qrCodeHeight : containerWidth;
  }

  getQrCodeImage() {
    if (!this.loadedQrCode) {
      return this.$api.get('/server/qrcode.svg', { responseType: 'text' as 'text' }).subscribe(
        (svg) => {
          this.qrcodeElement.nativeElement.innerHTML = svg;
          this.loadedQrCode = true;
        },
        (err) => {
          this.loadedQrCode = false;
        },
      );
    }
  }

  getPairingPin() {
    this.io.request('get-homebridge-pairing-pin').subscribe((data) => {
      this.pin = data.pin;
    });
  }

}
