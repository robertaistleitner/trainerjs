export interface HeartRateMonitorData {
    readonly heart_rate: number;
}

export interface HeartRateMonitor {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getData(): HeartRateMonitorData;

    // data updates
    onDataUpdated: (data: HeartRateMonitorData) => void;
}