declare global {
  var L: any;
}

export interface Company {
  title: string;
  address: string;
  uri: string;
}

// Simplified types for grounding metadata
export interface GroundingChunk {
  maps?: {
    title: string;
    uri: string;
  };
}

export interface GroundingMetadata {
  groundingChunks: GroundingChunk[];
}

export interface Candidate {
  groundingMetadata?: GroundingMetadata;
}