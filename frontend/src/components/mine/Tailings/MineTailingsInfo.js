import React, { Component } from "react";
import { Table } from "antd";
import NullScreen from "@/components/common/NullScreen";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { objectOf, arrayOf, string } from "prop-types";
import PropTypes from "prop-types";
import { Row, Col, Icon, Divider, Popconfirm, Button } from "antd";
import AuthorizationWrapper from "@/components/common/wrappers/AuthorizationWrapper";
import CustomPropTypes from "@/customPropTypes";
import * as ModalContent from "@/constants/modalContent";
import * as Permission from "@/constants/permissions";
import { modalConfig } from "@/components/modalContent/config";
import { BRAND_PENCIL, RED_CLOCK } from "@/constants/assets";
import {
  createMineExpectedDocument,
  removeExpectedDocument,
  updateExpectedDocument,
} from "@/actionCreators/mineActionCreator";
import {
  fetchExpectedDocumentStatusOptions,
  fetchMineTailingsRequiredDocuments,
} from "@/actionCreators/staticContentActionCreator";
import {
  getExpectedDocumentStatusOptions,
  getMineTSFRequiredReports,
} from "@/selectors/staticContentSelectors";
import { createDropDownList } from "@/utils/helpers";

import { ENVIRONMENT } from "@/constants/environment";
import { DOCUMENT_MANAGER_FILE_GET_URL } from "@/constants/API";
import * as String from "@/constants/strings";
/**
 * @class  MineTailingsInfo - all tenure information related to the mine.
 */

const propTypes = {
  mine: CustomPropTypes.mine.isRequired,
  fetchMineRecordById: PropTypes.func.isRequired,
  openModal: PropTypes.func.isRequired,
  closeModal: PropTypes.func.isRequired,
  fetchExpectedDocumentStatusOptions: PropTypes.func.isRequired,
  expectedDocumentStatusOptions: PropTypes.array,
  updateExpectedDocument: PropTypes.func.isRequired,
  removeExpectedDocument: PropTypes.func.isRequired,
  selectedDocument: PropTypes.object,
  mineTSFRequiredReports: PropTypes.array.isRequired,
  fetchMineTailingsRequiredDocuments: PropTypes.func.isRequired,
  createMineExpectedDocument: PropTypes.func.isRequired,
};

const defaultProps = {
  expectedDocumentStatusOptions: [],
  //requiredDocuments: [],
};

const DocumentStatusText = ({ doc, expectedDocumentStatusOptions }) => {
  if (!expectedDocumentStatusOptions[0]) return String.LOADING;
  if (!doc) return String.LOADING;

  return doc.exp_document_status_guid === "None"
    ? expectedDocumentStatusOptions[0].label
    : expectedDocumentStatusOptions.find(({ value }) => value === doc.exp_document_status_guid)
        .label;
};


const columns = [
  {
    title: "?",
    dataIndex: "dateReceived",
    key: "dateReceived",
    render: (text, record, index) => {
      console.log("text", text);
      console.log("record", record);
      console.log("index", index);
      const isOverdue = Date.parse(record.dateReceived) < new Date()
        && (record.statusId === "None" || (record.statusOptions[0]
        && record.statusId === record.statusOptions[0].value));
      return (
        <div>{isOverdue ? (<img className="padding-small" src={RED_CLOCK} alt="Edit TSF Report" />) : ( "" )}</div>
      )
    }
  },
  {
    title: "Name",
    dataIndex: "name",
    key: "name"
  },
  {
    title: "Received",
    dataIndex: "dateReceived",
    key: "received"
  }
];

const transformRowData = (tsfDocuments) =>
  tsfDocuments.map((doc, id, expectedDocumentStatusOptions) => {

  return {
    key: doc.exp_document_guid,
    docId: id,
    name: doc.exp_document_name,
    dateReceived: doc.due_date,
    statusID: doc.exp_document_status_guid,
    statusOptions: expectedDocumentStatusOptions,
  }});

/*
  return  */
export class MineTailingsInfo extends Component {
  state = { selectedDocument: {} };

  componentDidMount() {
    this.props.fetchExpectedDocumentStatusOptions();
    this.props.fetchMineTailingsRequiredDocuments();
  }

  handleAddReportSubmit = (value) => {
    const requiredReport = this.props.mineTSFRequiredReports.find(
      ({ req_document_guid }) => req_document_guid === value.req_document_guid
    );
    const newRequiredReport = {
      document_name: requiredReport.req_document_name,
      req_document_guid: requiredReport.req_document_guid,
    };
    return this.props
      .createMineExpectedDocument(this.props.mine.guid, newRequiredReport)
      .then(() => {
        this.props.closeModal();
        this.props.fetchMineRecordById(this.props.mine.guid);
      });
  };

  handleEditReportSubmit = (value) => {
    const updatedDocument = this.state.selectedDocument;
    updatedDocument.exp_document_name = value.tsf_report_name;
    updatedDocument.due_date = value.tsf_report_due_date;
    updatedDocument.received_date = value.tsf_report_received_date;
    updatedDocument.exp_document_status_guid = value.tsf_report_status;
    return this.props
      .updateExpectedDocument(updatedDocument.exp_document_guid, { document: updatedDocument })
      .then(() => {
        this.props.closeModal();
        this.props.fetchMineRecordById(this.props.mine.guid);
      });
  };

  removeReport = (event, exp_doc_guid) => {
    event.preventDefault();
    this.props.removeExpectedDocument(exp_doc_guid).then(() => {
      this.props.fetchMineRecordById(this.props.mine.guid);
    });
  };

  getFileFromDocumentManager = (docMgrFileGuid) => {
    const url = `${ENVIRONMENT.apiUrl + DOCUMENT_MANAGER_FILE_GET_URL}/${docMgrFileGuid}`;
    window.open(url, "_blank");
    // Document_manager GET endpoint is unathenticated right now.
    // TODO: updated this when Document manager tokens are implmeneted.
  };

  openAddReportModal(event, onSubmit, title, mineTSFRequiredReports) {
    event.preventDefault();
    const mineTSFRequiredReportsDropDown = createDropDownList(
      mineTSFRequiredReports,
      "req_document_name",
      "req_document_guid"
    );
    this.props.openModal({
      props: { onSubmit, title, mineTSFRequiredReportsDropDown },
      content: modalConfig.ADD_TAILINGS_REPORT,
    });
  };

  openEditReportModal(event, onSubmit, title, statusOptions, doc) {
    this.setState({
      selectedDocument: doc,
    });
    event.preventDefault();

    if (doc) {
      const initialValues = {
        tsf_report_name: doc.exp_document_name === "None" ? null : doc.exp_document_name,
        tsf_report_due_date: doc.due_date === "None" ? null : doc.due_date,
        tsf_report_received_date: doc.received_date === "None" ? null : doc.received_date,
        tsf_report_status:
          doc.exp_document_status_guid === "None" ? null : doc.exp_document_status_guid,
      };
      this.props.openModal({
        props: { onSubmit, title, statusOptions, initialValues, selectedDocument: doc },
        content: modalConfig.EDIT_TAILINGS_REPORT,
      });
    }
  };


  render() {
    return (
      <div>
        {this.props.mine.mine_tailings_storage_facility.map((facility) => (
          <div key={facility.mine_tailings_storage_facility_guid}>
            <h3>{facility.mine_tailings_storage_facility_name}</h3>
            <p>No TSF registry data available</p>
          </div>
        ))}

        <Table
          pagination={false}
          columns={columns}
          dataSource={transformRowData(this.props.mine.mine_expected_documents)}
          locale={{ emptyText: <NullScreen type="no-results" /> }}
        />

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Due</th>
              <th>Received</th>
              <th>Status</th>
              <th>Documents</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {this.props.mine.mine_expected_documents
              .sort((doc1, doc2) => {
                if (!(Date.parse(doc1.due_date) === Date.parse(doc2.due_date)))
                  return Date.parse(doc1.due_date) > Date.parse(doc2.due_date) ? 1 : -1;
                return doc1.exp_document_name > doc2.exp_document_name ? 1 : -1;
              })
              .map((doc, id) => {
                const isOverdue =
                  Date.parse(doc.due_date) < new Date() &&
                  (doc.exp_document_status_guid === "None" ||
                    (this.props.expectedDocumentStatusOptions[0] &&
                      doc.exp_document_status_guid ===
                        this.props.expectedDocumentStatusOptions[0].value));
                return (
                  <tr key={doc.exp_document_guid}>
                    <td>
                      {isOverdue ? (<img className="padding-small" src={RED_CLOCK} alt="Edit TSF Report" />) : ( "" )}
                    </td>
                    <td id={`name-${id}`}>
                      <h6>{doc.exp_document_name}</h6>
                    </td>
                    <td id={`due-date-${id}`}>
                      <h6>{doc.due_date === "None" ? "-" : doc.due_date}</h6>
                    </td>
                    <td>
                      <h6>{doc.received_date === "None" ? "-" : doc.received_date}</h6>
                    </td>
                    <td id={`status-${id}`}>
                      <span className={isOverdue ? "bold" : null}>
                        <DocumentStatusText doc={doc} expectedDocumentStatusOptions={this.props.expectedDocumentStatusOptions}/>
                      </span>
                    </td>
                    <td>
                      {!doc.related_documents ? "-" : doc.related_documents.map((file, id) => (
                        <div>
                          <a key={id} onClick={() => this.getFileFromDocumentManager(file.document_manager_guid)}>
                            {file.document_name}
                          </a>
                        </div>
                      ))}
                    </td>
                    <td>
                      <AuthorizationWrapper permission={Permission.CREATE} isMajorMine={this.props.mine.major_mine_ind}>
                        <div className="inline-flex">
                          <Button
                            className="full-mobile"
                            type="primary"
                            ghost
                            onClick={(event) =>
                              this.openEditReportModal(
                                event,
                                this.handleEditReportSubmit,
                                ModalContent.EDIT_TAILINGS_REPORT,
                                this.props.expectedDocumentStatusOptions,
                                doc
                              )
                            }>
                            <img src={BRAND_PENCIL} alt="Edit TSF Report" />
                          </Button>
                          <Popconfirm
                            placement="topLeft"
                            title={`Are you sure you want to delete ${doc.exp_document_name}?`}
                            onConfirm={(event) => this.removeReport(event, doc.exp_document_guid)}
                            okText="Delete"
                            cancelText="Cancel">
                            <Button className="full-mobile" ghost type="primary">
                              <Icon type="minus-circle" theme="outlined" />
                            </Button>
                          </Popconfirm>
                        </div>
                      </AuthorizationWrapper>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
        <div key="0">
          <AuthorizationWrapper
            permission={Permission.CREATE}
            isMajorMine={this.props.mine.major_mine_ind}>
            <Button type="secondary" ghost
              onClick={(event) =>
                this.openAddReportModal(
                  event,
                  this.handleAddReportSubmit,
                  ModalContent.ADD_TAILINGS_REPORT,
                  this.props.mineTSFRequiredReports
                )
              }>
              {`+ ${ModalContent.ADD_TAILINGS_REPORT}`}
            </Button>
          </AuthorizationWrapper>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  expectedDocumentStatusOptions: getExpectedDocumentStatusOptions(state),
  mineTSFRequiredReports: getMineTSFRequiredReports(state),
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      fetchExpectedDocumentStatusOptions,
      updateExpectedDocument,
      fetchMineTailingsRequiredDocuments,
      removeExpectedDocument,
      createMineExpectedDocument,
    },
    dispatch
  );

MineTailingsInfo.propTypes = propTypes;
MineTailingsInfo.defaultProps = defaultProps;

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MineTailingsInfo);
