import { DropdownButton, MenuItem } from 'react-bootstrap'
import { Tabs, Tab } from 'react-bootstrap'
import BaseComponent from 'BaseComponent'
import { ReactLoader } from 'Loader'
import Measure from 'react-measure'
import JSONView from 'JSONView'
import React from 'react'

export default class ScenesView extends BaseComponent {

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  constructor (props) {

    super (props)

    this.onTabSelected = this.onTabSelected.bind(this)
    this.deleteScene = this.deleteScene.bind(this)

    this.toolkitAPI = this.props.arvrToolkitAPI

    this.state = {
      activeTabKey: 'scene-info',
      instanceTree: null,
      sceneInfo: null,
      tabsWidth: 0,
      scene: null
    }
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  onTabSelected (tabKey) {

    this.assignState({
      activeTabKey: tabKey
    })
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  renderTabs () {

    const {activeTabKey, tabsWidth} = this.state

    const nbTabs = 3

    const style = {
      width:
        `${Math.floor((tabsWidth-8)/nbTabs-15)}px`
    }

    const tabTitle = (title) => {
      return (
        <label style={style}>
          {title}
        </label>
      )
    }

    return (
      <div className="scene-tabs">
        <Measure bounds onResize={(rect) => {
          this.assignState({
            tabsWidth: rect.bounds.width
          })
        }}>
        {
          ({ measureRef }) =>
            <div ref={measureRef} className="tabs-container">
              <Tabs activeKey={activeTabKey}
                onSelect={this.onTabSelected}
                id="scene-tabs"
                className="tabs">
                <Tab className="tab-container"
                  title={tabTitle('Scene Info')}
                  eventKey="scene-info"
                  key="scene-info">
                  {
                    (activeTabKey === 'scene-info') &&
                    this.renderSceneInfo()
                  }
                </Tab>
                <Tab className="tab-container"
                  title={tabTitle('Instance Tree')}
                  eventKey="instanceTree"
                  key="instanceTree">
                  {
                    (activeTabKey === 'instanceTree') &&
                    this.renderInstanceTree()
                  }
                </Tab>
                <Tab className="tab-container"
                  title={tabTitle('Resources')}
                  eventKey="resources"
                  key="resources">
                  {
                    (activeTabKey === 'resources') &&
                    this.renderResources()
                  }
                </Tab>
              </Tabs>
            </div>
          }
        </Measure>
      </div>
    )
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  guid (format = 'xxxx-xxxx-xxxx') {

    var d = new Date().getTime()

    const guid = format.replace(
      /[xy]/g,
      function (c) {
        var r = (d + Math.random() * 16) % 16 | 0
        d = Math.floor(d / 16)
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16)
      })

    return guid
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  async deleteScene () {

    const {urn, projectId, versionId} = this.props.model

    const {scene} = this.state

    const sceneId = scene.name

    const notification = this.props.notifySvc.add({
      title: 'Deleting scene ' + sceneId + ' ...',
      dismissible: false,
      status: 'loading',
      id: this.guid(),
      dismissAfter: 0,
      position: 'tl'
    })

    if (projectId) {

      await this.toolkitAPI.deleteScene3Legged (
        projectId, versionId, sceneId)

    } else {

      await this.toolkitAPI.deleteScene (
        urn, sceneId)
    }

    this.assignState({
      instanceTree: null,
      sceneInfo: null,
      scene: null
    })

    notification.title = `Scene ${sceneId} deleted!`
    notification.dismissAfter = 1500
    notification.status = 'success'

    this.props.notifySvc.update(notification)

    this.props.onSceneDeleted()
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  renderSceneInfo () {

    const {scene, sceneInfo} = this.state

    const showLoader = !sceneInfo && scene

    return (
      <div>
        <ReactLoader show={showLoader}/>
        {
          sceneInfo &&
          <JSONView src={sceneInfo}/>
        }
      </div>
    )
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  renderInstanceTree () {

    const {scene, instanceTree} = this.state

    const showLoader = !instanceTree && scene

    return (
      <div>
        <ReactLoader show={showLoader}/>
        {
          instanceTree &&
          <JSONView src={instanceTree}/>
        }
      </div>
    )
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  renderResources () {

    return (
      <div>
        NOT IMPLEMENTED
      </div>
    )
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  render () {

    const { scene, sceneInfo } = this.state

    const { model, scenes } = this.props

    const menuItems = !scenes
      ? null : scenes.map((sc, idx) => {
      return (
        <MenuItem eventKey={idx} key={idx}
          onClick={() => {

            this.assignState({
              instanceTree: null,
              sceneInfo: null,
              scene: sc
            })

            const urn = model.urn

            if (model.projectId) {

              const { projectId, versionId } = model

              this.toolkitAPI.getScene3Legged(
                projectId, versionId, sc.name).then(
                (sceneInfo) => {

                  this.assignState({
                    sceneInfo
                  })
                })

            } else {

              this.toolkitAPI.getScene(
                urn, sc.name).then(
                (sceneInfo) => {

                  this.assignState({
                    sceneInfo
                  })
                })
            }

            this.toolkitAPI.getInstanceTree(
              urn, sc.name).then(
              (instanceTree) => {

                this.assignState({
                  instanceTree
                })
              })
          }}>
          { sc.name }
        </MenuItem>
      )
    })

    return(
      <div className="scenes">
        <ReactLoader show={!scenes}/>
        <div className="controls">
          <DropdownButton
            title={`Select scene: ${scene ? scene.name : ''}`}
            disabled={!scenes || !scenes.length}
            key={'dropdown-scenes'}
            id={'dropdown-scenes'}>
              { menuItems }
          </DropdownButton>
          <button
            onClick={this.deleteScene}
            disabled={!sceneInfo}
            className="del-btn">
            <span className="fa fa-times"/>
            Delete scene ...
          </button>
        </div>
          { this.renderTabs() }
      </div>
    )
  }
}
