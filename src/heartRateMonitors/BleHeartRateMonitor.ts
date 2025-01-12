import { HeartRateMonitor, HeartRateMonitorData } from "../HeartRateMonitor";

export class BleHeartRateMonitor implements HeartRateMonitor {
  private bleDevice: BluetoothDevice;
  private gattServer: BluetoothRemoteGATTServer;
  private heartRateMeasurementCharacteristic: BluetoothRemoteGATTCharacteristic;
  private currentHeartRate: number = 0;

  public onDataUpdated: (updatedData: HeartRateMonitorData) => void = null;

  async connect(): Promise<void> {
    let connected = false;
    while (!connected) {
        try {
            // Request the Bluetooth device with the Heart Rate service
            this.bleDevice = await navigator.bluetooth.requestDevice({
                filters: [{ services: ["heart_rate"] }],
            });

            // Connect to the GATT server
            this.gattServer = await this.bleDevice.gatt.connect();

            // Get the Heart Rate service
            const service = await this.gattServer.getPrimaryService("heart_rate");

            // Get the Heart Rate Measurement characteristic
            this.heartRateMeasurementCharacteristic = await service.getCharacteristic(
                "heart_rate_measurement"
            );

            // Start notifications
            await this.heartRateMeasurementCharacteristic.startNotifications();

            // Set up an event listener to handle heart rate data
            this.heartRateMeasurementCharacteristic.addEventListener(
                "characteristicvaluechanged",
                this.handleHeartRateChanged.bind(this),
            );

            connected = true;
            console.log("Connected to Heart Rate Monitor");
            await (() => new Promise( resolve => setTimeout(resolve, 3000) ));
        } catch (error) {
            console.error("Error:", error);
        }
    }
  }

  handleHeartRateChanged(event: Event): void {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
    const heartRate = value.getUint8(1); // Heart rate value is at the second byte
    this.currentHeartRate = heartRate;
    this.onDataUpdated && this.onDataUpdated({
        heart_rate: heartRate,
    });
  }

  getData(): HeartRateMonitorData {
    return {
      heart_rate: this.currentHeartRate,
    };
  }

  async disconnect(): Promise<void> {
    await this.heartRateMeasurementCharacteristic.stopNotifications();
    this.heartRateMeasurementCharacteristic.removeEventListener("characteristicvaluechanged", this.handleHeartRateChanged);
    this.gattServer.disconnect();
  }
}
