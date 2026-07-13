export declare enum SupplementUnit {
    MG = "MG",
    G = "G",
    ML = "ML",
    IU = "IU",
    MCGG = "MCGG",
    TABLET = "TABLET",
    CAPSULE = "CAPSULE",
    SCOOP = "SCOOP",
    DROP = "DROP"
}
export declare class CreateSupplementDto {
    name: string;
    doseAmount: number;
    doseUnit: SupplementUnit;
    frequency?: string;
    timing?: string;
    notes?: string;
    caffeinePerDoseMg?: number;
}
