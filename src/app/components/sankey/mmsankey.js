'use strict';

angular.module('mmSankey', []).
directive('mmSankey', ['$state', function($state) {
    var width = 960,
        height = 700,
        margin_top = 5,
        margin_left = 5,
        min_node_radius = 15,
        max_node_radius = 80;

    var icons = {
            'miner': {
                c: '\uf10c',
                f: 'FontAwesome'
            },
            'processor': {
                c: '\uf069',
                f: 'FontAwesome'
            },
            'output': {
                c: '\uf111',
                f: 'FontAwesome'
            }
    };

    var ft_icon = function(d) {
        if (d.targetLinks.length === 0) {
            return icons['miner'].c;
        } else if (d.sourceLinks.length === 0) {
            return icons['output'].c;
        }

        return icons['processor'].c;
    };
    var ft_iconfont = function(d) {
        if (d.targetLinks.length === 0) {
            return icons['miner'].f;
        } else if (d.sourceLinks.length === 0) {
            return icons['output'].f;
        }

        return icons['processor'].f;
    };
    var ft_class = function(d) {
        var rclass = 'mw-sankey-node';

        if (d.nodeType === 'miner') {
            return rclass += ' mw-sankey-node-miner';
        }
        if (d.nodeType === 'output') {
            return rclass += ' mw-sankey-node-output';
        }
        if (d.nodeType === 'processor') {
            return rclass += ' mw-sankey-node-processor';
        }

        return rclass += ' mw-sankey-node-unknown';
    }

    var link_function = function(scope, elements, attrs) {
            var node_radius = function(n, kr) {
                return min_node_radius + n.value / 2 * kr;
            };

            var tip = d3.tip().attr('class', 'd3-tip')
                .direction('n')
                .offset(function (d) {
                    if (d.source_name) {
                        return [this.getBBox().height/2-20, 0];
                    }

                    return [-10, 0];
                })
                .html(function(d) {
                    var lines;

                    if (d.source_name) {
                        lines = [
                            '<p class="text-center strong">' + d.source_name + '</p>',
                            '<p>' + d.updates_emitted + ' UPDATE.TX</p>'
                        ];
                    } else {
                        lines = [
                            '<p class="text-center strong">' + d.name + '</p>',
                            '<p>' + d.num_indicators + ' INDICATORS</p>'
                        ];
                    }

                    return lines.join('');
                });

            var svg = d3.select(elements[0]).append("svg")
                .classed("d3-responsive", true)
                .attr("preserveAspectRatio", "xMinYMin meet")
                .attr("viewBox", "0 0 " + width + " " + height)
                .append("g")
                .attr("transform", "translate(" + margin_top + "," + margin_left + ")");;

            var sankey = d3.sankey().nodePadding(10)
                .size([width - margin_top * 2, height - margin_left * 2]);

            var path = sankey.link();

            scope.$watch('fts', function(nFTs, oFTs) {
                var fts = {
                    nodes_flat: [],
                    nodes: [],
                    links: []
                }

                // XXX spazziamo via tutto ma da rifare
                svg.selectAll('*').remove();
                svg.call(tip);

                if (!nFTs) return;

                angular.forEach(nFTs, function(ftnode, ftindex) {
                    var uec;
                    var ftname;
                    var cupdates_emitted;
                    var ftstatus = ftnode.status;

                    ftname = ftstatus.name;
                    cupdates_emitted = (ftstatus['statistics']['update.tx'] === undefined) ? 0 : ftstatus['statistics']['update.tx'];
                    fts.nodes_flat.push(ftname);

                    uec = true;
                    if (oFTs && oFTs[ftname]) {
                        uec = (cupdates_emitted == oFTs[ftname].updates_emitted) ? false : true;
                    }

                    fts.nodes.push({
                        name: ftname,
                        nodeType: ftnode.nodeType,
                        value: Math.sqrt(ftstatus['length']),
                        num_indicators: ftstatus['length'],
                        updates_emitted: cupdates_emitted,
                        class: ftstatus.class,
                        updates_emitted_changed: uec
                    });
                });

                angular.forEach(nFTs, function(ftnode, ftindex) {
                    var ftstatus = ftnode.status;
                    var ftname = ftstatus.name;

                    angular.forEach(ftstatus.inputs, function(input) {
                        var cnode;

                        cnode = fts.nodes[fts.nodes_flat.indexOf(input)];

                        fts.links.push({
                            source: fts.nodes_flat.indexOf(input),
                            target: fts.nodes_flat.indexOf(ftname),
                            value: Math.max(Math.sqrt(cnode.updates_emitted), 0.1),
                            updates_emitted: cnode.updates_emitted,
                            source_name: input,
                            target_name: ftname,
                            changed: fts.nodes[fts.nodes_flat.indexOf(input)].updates_emitted_changed
                        });
                    });
                });
                var totalNodesValue = d3.sum(fts.nodes, function(d) {
                    return d.value;
                });
                totalNodesValue = Math.max(totalNodesValue, 1);
                var kr = (max_node_radius - min_node_radius) / totalNodesValue;

                sankey.nodes(fts.nodes).links(fts.links)
                    .maxNodeWidth(max_node_radius * 2)
                    .minNodeWidth(min_node_radius * 2)
                    .layout(32);

                var link = svg.append("g").selectAll(".mw-sankey-link").data(fts.links)
                    .enter().append("path")
                    .attr("class", "mw-sankey-link")
                    .style("stroke", function(d) {
                        if (d.changed) {
                            return '#28556F';
                        }
                        return '#000';
                    })
                    .attr("d", path)
                    .style("stroke-width", function(d) {
                        if (d.value == 0.1) {
                            return 1;
                        }
                        return Math.min(max_node_radius*1.1, Math.max(0.1, d.dy));
                    })
                    .sort(function(a, b) {
                        return b.dy - a.dy;
                    })
                    .on('mouseover', tip.show)
                    .on('mouseout', tip.hide);
                link.filter(function(d) {
                        return d.changed;
                    })
                    .transition()
                    .style('stroke', '#000')
                    .duration(1000);

                var node = svg.append("g").selectAll(".mw-sankey-node").data(fts.nodes)
                    .enter().append("g")
                    .attr("class", ft_class)
                    .attr("transform", function(d) {
                        return "translate(" + d.x + "," + d.y + ")";
                    });

                node.append("circle")
                    .attr("cx", function(d) {
                        return d.dx / 2;
                    })
                    .attr("cy", function(d) {
                        return d.dx / 2;
                    })
                    .attr("r", function(d) {
                        return node_radius(d, kr);
                    });

                node.append("text")
                    .attr("x", function(d) {
                        return d.dx / 2;
                    })
                    .attr("y", function(d) {
                        return d.dx / 2;
                    })
                    // .attr("dy", function(d) { return Math.sqrt(2)*node_radius(d, kr)*0.8/2; })
                    .attr("alignment-baseline", "central")
                    .attr("text-anchor", "middle")
                    .attr("transform", null)
                    .attr("font-size", function(d) {
                        return Math.sqrt(2) * node_radius(d, kr) * 0.8;
                    })
                    .attr("font-family", ft_iconfont)
                    .text(ft_icon);

                node.append("circle")
                    .attr("cx", function(d) {
                        return d.dx / 2;
                    })
                    .attr("cy", function(d) {
                        return d.dx / 2;
                    })
                    .attr("r", function(d) {
                        return node_radius(d, kr);
                    })
                    .classed('node-overlay', true)
                    .on('mouseover', tip.show)
                    .on('mouseout', tip.hide)
                    .on('click', function(d) {
                        if (d.name == scope.currentFt) {
                            return;
                        }

                        tip.hide();
                        $state.go('nodedetail.info', { nodename: d.name });
                    });

                node.append("text")
                    .attr("x", function(d) {
                        if (d.x < width / 2) {
                            return d.dx / 2 + node_radius(d, kr) + 3;
                        }
                        return d.dx / 2 - node_radius(d, kr) - 3;
                    })
                    .attr("y", function(d) {
                        return d.dx / 2 + node_radius(d, kr) + 3;
                    })
                    .attr("text-anchor", function(d) {
                        if (d.x < width / 2) {
                            return "start";
                        }
                        return "end";
                    })
                    .attr("transform", null)
                    .attr("font-size", 10)
                    .style("fill", "#000", "important")
                    .text(function(d) {
                        return d.name;
                    });
            });
    };

    return {
        strict: 'E',
        link: link_function,
        scope: {
            fts: '=',
            currentFt: '='
        }
    };
}])
;

