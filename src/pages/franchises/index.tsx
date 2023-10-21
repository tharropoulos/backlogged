import { type NextPage } from "next";
import { SEO } from "~/components/SEO";
import { FranchiseTable } from "~/components/tables/franchise-table";

const FranchisesPage: NextPage = () => {
  return (
    <>
      <SEO title="Franchises" />
      <div className="container w-3/4">
        <FranchiseTable />
      </div>
    </>
  );
};

export default FranchisesPage;
