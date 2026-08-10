import {
  getNavPageLayoutPropsFromConfig,
  NavPageLayout,
  NavPageLayoutProps,
} from '@gen3/frontend';
import { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';

const ChatLoading = () => (
  <div className="flex items-center justify-center h-full w-full">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-base-darkest"></div>
  </div>
);

// Chat reaches @copilotkit/react-core through useChat. Keep it out of the module
// graph this page is evaluated with on the server: _app never renders on the server,
// but the page module is still required there because getServerSideProps lives in it.
const Chat = dynamic(
  () => import('@/features/chat/ui').then((m) => m.Chat),
  { ssr: false, loading: () => <ChatLoading /> },
);

const ChatPage = ({ headerProps, footerProps }: NavPageLayoutProps) => {
  return (
    <NavPageLayout
      {...{ headerProps, footerProps }}
      mainProps={{ fixed: true }}
      headerMetadata={{
        title: 'Genomic AI Commons Chat',
        content: 'AI Chat',
        key: 'gac-chat-page',
      }}
    >
      <Chat agentId="default" />
    </NavPageLayout>
  );
};

export const getServerSideProps: GetServerSideProps<
  NavPageLayoutProps
> = async () => {
  return {
    props: {
      ...(await getNavPageLayoutPropsFromConfig()),
    },
  };
};

export default ChatPage;
