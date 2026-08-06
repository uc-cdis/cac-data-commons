import React from 'react';
import {
  Image,
  SimpleGrid,
} from '@mantine/core';
import {
  getNavPageLayoutPropsFromConfig,
  NavPageLayout,
  NavPageLayoutProps,
} from '@gen3/frontend';
import { GetServerSideProps } from 'next';
import InfoCard from '@/components/InfoCard';

const SamplePage = ({ headerProps, footerProps }: NavPageLayoutProps) => {
  return (
    <NavPageLayout
      {...{ headerProps, footerProps }}
      headerMetadata={{
        title: 'Genomic AI Commons',
        content: 'Landing page',
        key: 'gac-landing-page',
      }}
    >
      <div className="flex flex-col w-full">
        <div className="w-full h-[424px] relative bg-black">
          <div
            className="p-20 relative"
            style={{
              backgroundImage: 'url(/images/frequency-wave-7776034_1920-3.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Overlay for opacity */}
            <div className="absolute inset-0 bg-black opacity-[.45] z-5"></div>

            <div className="relative z-10">
              <div className="justify-start text-white text-4xl font-bold font-['Poppins']">
                 AI Commons
              </div>
              <div className="justify-start text-white text-2xl font-semibold font-['Poppins'] my-4">
                Powerful AI tools available alongside core data commons
                capabilities.
              </div>
              <div className="w-[1040px] h-20 justify-start">
                <span className="text-white text-sm font-bold font-['Poppins']">
                  The Genomic AI commons
                </span>
                <span className="text-white text-sm font-normal font-['Poppins']">
                  {' '}
                  is a cloud-based data platform with a governance structure and
                  architecture for managing, analyzing, and sharing data and AI
                  resources supporting: multi-modal AI embeddings, AI
                  inferencing, building AI models, and natural language
                  interactions. One over-arching mission of the Genomic AI Commons is
                  to make readily accessible small to midscale AI models trained
                  over high-quality data leveraging affordable compute resources
                  without sacrificing performance comparable to high-cost
                  frontier models.
                </span>
              </div>
              { /*--
              <UnstyledButton
                className={
                  'mt-10 px-4 py-3 bg-white/25 rounded outline outline-1 outline-offset-[-1px] outline-white inline-flex justify-start items-center gap-2.5'
                }
              >
                <div className="justify-start text-white text-sm font-semibold font-['Poppins'] leading-4">
                  Explore Genomic AI Commons
                </div>
              </UnstyledButton>
              --- */ }
            </div>
          </div>
        </div>
        <div className="bg-[#f3f6f9] px-20 py-10 flex flex-col">
          <div className="flex flex-col justify-center items-center">
            <div className="w-16 h-16">
              <Image
                src="/icons/M3-Logomark-RGB.svg"
                alt="Genomic AI Commons Logo"
                w="auto"
                fit="contain"
                height={64}
              />
            </div>
            <div className="text-center justify-start text-[#111111] text-2xl font-semibold font-['Poppins']">
              Genomic AI Commons Core Services
            </div>
            <SimpleGrid
              cols={3}
              spacing="xl"
              verticalSpacing="xl"
              className="mt-10"
            >
              <InfoCard
                title="FAIR Data"
                description="CTDS and Gen3 remain globally recognized leaders in FAIR data sharing platforms ensuring secure AI-ready data."
                imgSrc="/icons/Icon-FD.svg"
              />
              <InfoCard
                title="Embedding Service"
                description="Genomic AI Commons embedding-centric approach, including vector store and API, in tandem with Gen3 narrow-middle architecture provides flexible scalability."
                imgSrc="/icons/Icon-ES.svg"
              />
              <InfoCard
                title="Model Inference Services"
                description="Share inferencing workflows with selected models leveraging prompt-based or batch-based inferencing."
                imgSrc="/icons/Icon-MIS.svg"
              />
              <InfoCard
                title="Model Training Services"
                description="Build and train machine learning and small to midscale AI models over data in a federated Commons leveraging Jupyter notebooks in cloud-based workspaces and containerized workflow execution services."
                imgSrc="/icons/Icon-MTS.svg"
              />
              <InfoCard
                title="Model Repository Services"
                description="Store models that can be retrieved by the model inference service, as well as models produced by the model training services."
                imgSrc="/icons/Icon-MRS.svg"
              />
              <InfoCard
                title="Agentic Interfaces"
                description="Query and manage AI-ready data leveraging LLM and AI agentic services interoperating with the commons."
                imgSrc="/icons/Icon-AI.svg"
              />
            </SimpleGrid>
          </div>
        </div>
      </div>
    </NavPageLayout>
  );
};

// TODO: replace this with a custom getServerSideProps function
export const getServerSideProps: GetServerSideProps<
  NavPageLayoutProps
> = async () => {
  return {
    props: {
      ...(await getNavPageLayoutPropsFromConfig()),
    },
  };
};

export default SamplePage;
