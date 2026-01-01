import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/axiosFactory';
import {
  CreateRolePayload,
  CreateRoleResponse,
  UpdateRolePayload,
  UpdateRoleResponse,
  DeleteRoleResponse,
  GetRolesByProgramResponse,
} from '@/utils/types/programDepartmentRole';
import { CommonApiError } from '@/utils/types/common';

/**
 * Create or update role for a program-department combination
 */
export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateRoleResponse, CommonApiError, CreateRolePayload>({
    mutationKey: ['createRole'],
    mutationFn: async (payload: CreateRolePayload) => {
      const response = await api.post<CreateRoleResponse>(
        '/program-department-role',
        payload
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate roles for this program
      queryClient.invalidateQueries({
        queryKey: ['getRolesByProgram', variables.programId],
      });
      // Invalidate program queries to refresh department role data
      queryClient.invalidateQueries({
        queryKey: ['getPrograms'],
      });
      queryClient.invalidateQueries({
        queryKey: ['getProgramById'],
      });
    },
  });
};

/**
 * Update role description
 */
export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateRoleResponse,
    CommonApiError,
    { id: string } & UpdateRolePayload
  >({
    mutationKey: ['updateRole'],
    mutationFn: async ({ id, roleDescription }) => {
      const response = await api.patch<UpdateRoleResponse>(
        `/program-department-role/${id}`,
        { roleDescription }
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all role queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['getRolesByProgram'],
      });
      // Invalidate program queries to refresh department role data
      queryClient.invalidateQueries({
        queryKey: ['getPrograms'],
      });
      queryClient.invalidateQueries({
        queryKey: ['getProgramById'],
      });
    },
  });
};

/**
 * Delete role
 */
export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteRoleResponse, CommonApiError, string>({
    mutationKey: ['deleteRole'],
    mutationFn: async (roleId: string) => {
      const response = await api.delete<DeleteRoleResponse>(
        `/program-department-role/${roleId}`
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all role queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['getRolesByProgram'],
      });
    },
  });
};

/**
 * Get all roles for a program
 */
export const useGetRolesByProgram = (programId: string | undefined) => {
  return useQuery<GetRolesByProgramResponse, CommonApiError>({
    queryKey: ['getRolesByProgram', programId],
    queryFn: async () => {
      if (!programId) {
        throw new Error('Program ID is required');
      }
      const response = await api.get<GetRolesByProgramResponse>(
        `/program-department-role/program/${programId}`
      );
      return response.data;
    },
    enabled: !!programId,
  });
};
