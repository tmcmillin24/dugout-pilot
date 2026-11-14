import { supabase } from './supabase';
import type { Board } from './coaching/board';
export type Organization={id:string;name:string;join_code:string;created_at:string};
export type OrganizationTeam={team_id:string;name:string;player_count:number;import_count:number;last_import:string|null;age:string;sport:string};
async function rpc<T>(name:string,args:Record<string,unknown>):Promise<T>{const {data,error}=await supabase.rpc(name,args);if(error)throw error;return data as T;}
export async function listOrganizations():Promise<Organization[]>{const {data,error}=await supabase.from('organizations').select('id,name,join_code,created_at').order('name');if(error)throw error;return data??[];}
export const createOrganization=(name:string,id:string)=>rpc<string>('create_organization',{p_name:name.trim(),p_request_id:id});
export const rotateOrganizationCode=(id:string)=>rpc<string>('rotate_organization_code',{p_organization_id:id});
export const linkTeamOrganization=(teamId:string,code:string)=>rpc<string>('link_team_organization',{p_team_id:teamId,p_code:code.trim()});
export const getTeamOrganization=(teamId:string)=>rpc<{id:string;name:string}[]>('team_organization',{p_team_id:teamId});
export const disconnectTeamOrganization=(teamId:string)=>rpc<void>('disconnect_team_organization',{p_team_id:teamId});
export const listOrganizationTeams=(id:string,page=0)=>rpc<OrganizationTeam[]>('list_organization_teams',{p_organization_id:id,p_page:page});
export const organizationTeamStats=(id:string,teamId:string)=>rpc<Board|null>('organization_team_stats',{p_organization_id:id,p_team_id:teamId});
