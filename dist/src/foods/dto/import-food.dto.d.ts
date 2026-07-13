export declare enum ImportSource {
    USDA = "USDA",
    OFF = "OFF",
    CUSTOM = "CUSTOM"
}
export declare class ImportFoodDto {
    source: ImportSource;
    externalId?: string;
    name?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
}
