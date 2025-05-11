import { SupportedPlatform } from "./SupportedPlatform";

export interface RepoInfo {
    owner: string;
    repo: string;
    type: SupportedPlatform | 'local';
    token: string | null;
    localPath: string | null;
    repoUrl: string | null;
}

export default RepoInfo;