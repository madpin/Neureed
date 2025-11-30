/**
 * Icon System
 *
 * Centralized icon exports using lucide-react.
 * Provides tree-shakeable, consistent icons across the application.
 */

export {
  // Common UI icons
  X,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Search,
  Settings,
  User,
  Mail,
  Bell,
  Home,
  Menu,
  MoreVertical,
  MoreHorizontal,
  Edit,
  Trash2,
  Save,
  Copy,
  Share2,
  Download,
  Upload,
  ExternalLink,
  Info,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Star,
  Heart,
  Bookmark,
  Calendar,
  Clock,
  Filter,
  RefreshCw,
  Loader2,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,

  // Feed-specific icons
  Rss,
  BookOpen,
  FileText,
  Folder,
  FolderOpen,
  Tag,

  // Type exports for TypeScript
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

/**
 * Common icon sizes
 */
export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export type IconSize = keyof typeof iconSizes;
