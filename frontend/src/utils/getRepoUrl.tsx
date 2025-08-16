import RepoInfo from "@/types/repoinfo";

export default function getRepoUrl(repoInfo: RepoInfo): string {
  console.log('getRepoUrl', repoInfo);
  if (repoInfo.type === 'local' && repoInfo.localPath) {
    return repoInfo.localPath;
  } else {
    if(repoInfo.repoUrl) {
      return repoInfo.repoUrl;
    } else {
      if(repoInfo.owner && repoInfo.repo) {
        return "http://example/" + repoInfo.owner + "/" + repoInfo.repo;
      }
      return '';
    }
  }
};