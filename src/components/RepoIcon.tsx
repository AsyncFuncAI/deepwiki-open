import { SupportedPlatform } from '@/types/SupportedPlatform';
import { FaGithub, FaGitlab, FaBitbucket } from 'react-icons/fa';
import { SiGitea } from 'react-icons/si';

const iconMap = {
    github: FaGithub,
    gitlab: FaGitlab,
    bitbucket: FaBitbucket,
    gitea: SiGitea,
};
interface RepoIconProps {
    type: SupportedPlatform;
    className?: string;
}

export const RepoIcon: React.FC<RepoIconProps> = ({ type, className = 'mr-2' }) => {
    const IconComponent = iconMap[type] || FaBitbucket;
    return <IconComponent className={className} />;
  };