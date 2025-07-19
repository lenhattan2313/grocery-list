"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Household, HouseholdMember } from "@prisma/client";
import { useSession } from "next-auth/react";

type HouseholdWithMembers = Household & {
  members: (HouseholdMember & {
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  })[];
};

async function getHousehold(): Promise<HouseholdWithMembers | null> {
  const res = await fetch("/api/households");
  if (!res.ok) {
    throw new Error("Failed to fetch household");
  }
  return res.json();
}

async function createHousehold(): Promise<HouseholdWithMembers> {
  const res = await fetch("/api/households", {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("Failed to create household");
  }
  return res.json();
}

export function useHouseholdQuery() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const {
    data,
    isLoading: isLoadingHousehold,
    isSuccess,
  } = useQuery<HouseholdWithMembers | null>({
    queryKey: ["household", userId],
    queryFn: getHousehold,
    enabled: !!userId,
  });

  const { mutate, isPending: isCreatingHousehold } =
    useMutation<HouseholdWithMembers>({
      mutationFn: createHousehold,
      onSuccess: (newHousehold) => {
        queryClient.setQueryData(["household", userId], newHousehold);
      },
      onError: (error) => {
        console.error("Failed to create household", error);
      },
    });

  useEffect(() => {
    if (isSuccess && !data) {
      mutate();
    }
  }, [isSuccess, data, mutate]);

  return {
    household: data,
    isLoading: isLoadingHousehold || isCreatingHousehold,
  };
}
