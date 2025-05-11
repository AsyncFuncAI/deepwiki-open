import RepoInfo from "@/types/repoinfo";

export default function getRepoUrl(repoInfo: RepoInfo): string {
  console.log('getRepoUrl', repoInfo);
  if (repoInfo.type === 'local' && repoInfo.localPath) {
    return repoInfo.localPath;
  } else {
    return repoInfo.repoUrl || '';
  }
};