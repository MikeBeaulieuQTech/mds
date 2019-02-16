import React from "react";
import { func, objectOf, arrayOf, string } from "prop-types";
import { Link } from "react-router-dom";
import { Table } from "antd";
import { uniqBy, isEmpty } from "lodash";
import * as router from "@/constants/routes";
import * as Strings from "@/constants/strings";
import NullScreen from "@/components/common/NullScreen";
import CustomPropTypes from "@/customPropTypes";

// TODO: refactor to use state
let sort_field;
let sort_dir = false;

/**
 * @class MineList - paginated list of mines
 */

const propTypes = {
  mines: objectOf(CustomPropTypes.mine).isRequired,
  mineIds: arrayOf(string).isRequired,
  mineRegionHash: objectOf(string).isRequired,
  mineTenureHash: objectOf(string).isRequired,
  mineCommodityOptionsHash: objectOf(string).isRequired,
  handleMineSearch: func.isRequired,
};

const columns = [
  {
    title: "Mine Name",
    width: 200,
    dataIndex: "mineName",
    fieldName: "mine_name",
    render: (text, record) => (
      <Link to={router.MINE_SUMMARY.dynamicRoute(record.key)} className="mine-list__name">
        {text}
      </Link>
    ),
    sorter: true,
    sortOrder: sort_field === "mine_name" ? sort_dir : false,
  },
  {
    title: "Mine No.",
    width: 100,
    dataIndex: "mineNo",
    fieldName: "mine_no",
    render: (text, record) => (
      <div title="Mine Number">
        {text}
        {!text && <div>{record.emptyField}</div>}
      </div>
    ),
    sorter: true,
    sortOrder: sort_field === "mine_no" ? sort_dir : false,
  },
  {
    title: "Operational Status",
    width: 160,
    dataIndex: "operationalStatus",
    fieldName: "operational_status_code",
    render: (text, record) => (
      <div title="Operational Status">
        {text}
        {!text && <div>{record.emptyField}</div>}
      </div>
    ),
  },
  {
    title: "Permit No.",
    width: 150,
    dataIndex: "permit",
    fieldName: "permit_no",
    render: (text, record) => (
      <div title="Permit Number">
        <ul className="mine-list__permits">
          {text &&
            uniqBy(text, "permit_no").map(({ permit_no, permit_guid }) => (
              <li key={permit_guid}>{permit_no}</li>
            ))}
          {!text && <li>{record.emptyField}</li>}
        </ul>
      </div>
    ),
  },
  {
    title: "Region",
    width: 150,
    dataIndex: "region",
    fieldName: "mine_region",
    render: (text, record) => (
      <div title="Region">
        {text}
        {!text && <div>{record.emptyField}</div>}
      </div>
    ),
    sorter: true,
    sortOrder: sort_field === "mine_region" ? sort_dir : false,
  },
  {
    title: "Tenure",
    width: 150,
    dataIndex: "tenure",
    render: (text, record) => (
      <div title="Tenure">
        {text &&
          text.map((tenure) => (
            <span className="mine_tenure" key={tenure.mine_type_guid}>
              {record.tenureHash[tenure.mine_tenure_type_code]}
            </span>
          ))}
        {!text && <div>{record.emptyField}</div>}
      </div>
    ),
  },
  {
    title: "Commodity",
    dataIndex: "commodity",
    width: 150,
    render: (text, record) => (
      <div title="Commodity">
        {text &&
          text.map(({ mine_type_detail, mine_type_guid }) => (
            <div key={mine_type_guid}>
              {mine_type_detail.map(({ mine_commodity_code, mine_type_detail_guid }) => (
                <span key={mine_type_detail_guid}>
                  {mine_commodity_code && `${record.commodityHash[mine_commodity_code]},`}
                </span>
              ))}
            </div>
          ))}
      </div>
    ),
  },
  {
    title: "TSF",
    dataIndex: "tsf",
    width: 150,
    render: (text) => <div title="TSF">{text}</div>,
    sorter: true,
  },
];

const transformRowData = (mines, mineIds, mineRegionHash, mineTenureHash, mineCommodityHash) =>
  mineIds.map((id) => ({
    key: id,
    emptyField: Strings.EMPTY_FIELD,
    mineName: mines[id].mine_name ? mines[id].mine_name : Strings.EMPTY_FIELD,
    mineNo: mines[id].mine_no ? mines[id].mine_no : Strings.EMPTY_FIELD,
    operationalStatus: mines[id].mine_status[0]
      ? mines[id].mine_status[0].status_labels[0]
      : Strings.EMPTY_FIELD,
    permit: mines[id].mine_permit[0] ? mines[id].mine_permit : null,
    region: mines[id].region_code ? mineRegionHash[mines[id].region_code] : Strings.EMPTY_FIELD,
    commodity: mines[id].mine_type[0] ? mines[id].mine_type : null,
    commodityHash: mineCommodityHash,
    tenure: mines[id].mine_type[0] ? mines[id].mine_type : null,
    tenureHash: mineTenureHash,
    tsf: mines[id].mine_tailings_storage_facility
      ? mines[id].mine_tailings_storage_facility.length
      : Strings.EMPTY_FIELD,
  }));

const handleTableChange = (updateMineList) => (pagination, filters, sorter) => {
  if (!isEmpty(sorter)) {
    const {
      order,
      column: { fieldName },
    } = sorter;
    sort_field = fieldName;
    sort_dir = order;
    updateMineList({ sort_field: fieldName, sort_dir: order === "descend" ? "desc" : "asc" });
  }
};

export const MineList = (props) => (
  <Table
    align="center"
    className="mine-list"
    pagination={false}
    columns={columns}
    dataSource={transformRowData(
      props.mines,
      props.mineIds,
      props.mineRegionHash,
      props.mineTenureHash,
      props.mineCommodityOptionsHash
    )}
    locale={{ emptyText: <NullScreen type="no-results" /> }}
    onChange={handleTableChange(props.handleMineSearch)}
  />
);

MineList.propTypes = propTypes;

export default MineList;
