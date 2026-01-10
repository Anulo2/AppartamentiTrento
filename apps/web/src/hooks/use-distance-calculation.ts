import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

interface Destination {
  name: string;
  lat: number;
  lng: number;
}

interface DistanceCalculationProps {
  apartmentId: number;
  destination: Destination | null;
  hasCoordinates: boolean;
}

export function useDistanceCalculation({
  apartmentId,
  destination,
  hasCoordinates,
}: DistanceCalculationProps) {
  const distanceQuery = useQuery({
    ...orpc.apartment.calculateDistance.queryOptions({
      apartmentId,
      destinationLat: destination?.lat ?? 0,
      destinationLng: destination?.lng ?? 0,
    }),
    enabled: !!destination && hasCoordinates,
  });

  const transitQuery = useQuery({
    ...orpc.apartment.calculateTransitTime.queryOptions({
      apartmentId,
      destinationLat: destination?.lat ?? 0,
      destinationLng: destination?.lng ?? 0,
    }),
    enabled: !!destination && hasCoordinates,
  });

  return {
    walkingTime: distanceQuery.data?.walkingTime,
    transitTime: transitQuery.data?.transitTime,
    isLoading: distanceQuery.isLoading || transitQuery.isLoading,
    hasError: distanceQuery.isError || transitQuery.isError,
  };
}
